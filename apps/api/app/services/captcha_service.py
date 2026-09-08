import base64
import html
import random
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.captcha import Captcha, CaptchaChallenge, CaptchaRotationState


CAPTCHA_VALUES = [
    "K7P4X",
    "M9Q2R",
    "T5N8A",
    "B6Y3K",
    "H8D2P",
    "W4F7M",
    "C9R5T",
    "X3K8N",
    "P6A4Z",
    "R7M2Q",
]


class CaptchaService:
    """Creates and validates one-time CAPTCHA login challenges."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_seeded(self) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(Captcha)
            .where(Captcha.captcha_text.not_in(CAPTCHA_VALUES))
            .values(is_active=False, updated_at=now)
        )
        for index, value in enumerate(CAPTCHA_VALUES, start=1):
            existing = await self.db.scalar(
                select(Captcha).where(Captcha.captcha_text == value)
            )
            if existing:
                existing.order_index = index
                existing.is_active = True
                existing.updated_at = now
            else:
                self.db.add(
                    Captcha(
                        captcha_text=value,
                        order_index=index,
                        is_active=True,
                        created_at=now,
                        updated_at=now,
                    )
                )

        state = await self.db.get(CaptchaRotationState, 1)
        if not state:
            self.db.add(CaptchaRotationState(id=1, current_index=0, updated_at=now))
        await self.db.commit()

    async def create_challenge(self) -> dict:
        await self.ensure_seeded()
        now = datetime.now(timezone.utc)

        async with self.db.begin():
            state = await self.db.scalar(
                select(CaptchaRotationState)
                .where(CaptchaRotationState.id == 1)
                .with_for_update()
            )
            if not state:
                state = CaptchaRotationState(id=1, current_index=0, updated_at=now)
                self.db.add(state)
                await self.db.flush()

            captcha = await self.db.scalar(
                select(Captcha)
                .where(Captcha.is_active.is_(True))
                .order_by(Captcha.order_index)
                .offset(state.current_index % len(CAPTCHA_VALUES))
                .limit(1)
            )
            if not captcha:
                raise RuntimeError("No active CAPTCHA records are available.")

            state.current_index = (state.current_index + 1) % len(CAPTCHA_VALUES)
            state.updated_at = now

            challenge = CaptchaChallenge(
                challenge_token=secrets.token_urlsafe(32),
                captcha_id=captcha.id,
                expires_at=now + timedelta(minutes=5),
                used_at=None,
                created_at=now,
            )
            self.db.add(challenge)
            await self.db.flush()

        return {
            "challengeToken": challenge.challenge_token,
            "image": self._render_svg_data_uri(captcha.captcha_text),
        }

    async def refresh_challenge(self, challenge_token: Optional[str]) -> dict:
        token = (challenge_token or "").strip()
        if token:
            await self.db.execute(
                update(CaptchaChallenge)
                .where(
                    CaptchaChallenge.challenge_token == token,
                    CaptchaChallenge.used_at.is_(None),
                )
                .values(used_at=datetime.now(timezone.utc))
            )
            await self.db.commit()
        return await self.create_challenge()

    async def consume_and_validate(self, challenge_token: Optional[str], captcha_value: Optional[str]) -> bool:
        token = (challenge_token or "").strip()
        submitted = (captcha_value or "").strip()
        if not token or not submitted or len(token) > 128 or len(submitted) > 20:
            return False

        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(CaptchaChallenge)
            .where(
                CaptchaChallenge.challenge_token == token,
                CaptchaChallenge.used_at.is_(None),
                CaptchaChallenge.expires_at > now,
            )
            .values(used_at=now)
            .returning(CaptchaChallenge.captcha_id)
        )
        captcha_id = result.scalar_one_or_none()
        await self.db.commit()

        if not captcha_id:
            return False

        expected = await self.db.scalar(
            select(Captcha.captcha_text).where(Captcha.id == captcha_id)
        )
        return submitted == expected

    async def active_master_count(self) -> int:
        count = await self.db.scalar(
            select(func.count()).select_from(Captcha).where(Captcha.is_active.is_(True))
        )
        return int(count or 0)

    @staticmethod
    def _render_svg_data_uri(captcha_text: str) -> str:
        width = 220
        height = 70
        chars = []
        for index, char in enumerate(captcha_text):
            x = 28 + index * 34 + random.randint(-3, 3)
            y = 43 + random.randint(-5, 5)
            rotation = random.randint(-14, 14)
            chars.append(
                f'<text x="{x}" y="{y}" transform="rotate({rotation} {x} {y})">{html.escape(char)}</text>'
            )

        dots = "\n".join(
            f'<circle cx="{random.randint(8, width - 8)}" cy="{random.randint(8, height - 8)}" r="{random.choice([1, 1.4, 1.8])}" />'
            for _ in range(34)
        )
        lines = "\n".join(
            f'<path d="M {random.randint(0, 30)} {random.randint(15, height - 15)} C {random.randint(60, 100)} {random.randint(0, height)}, {random.randint(120, 160)} {random.randint(0, height)}, {random.randint(width - 30, width)} {random.randint(15, height - 15)}" />'
            for _ in range(random.randint(2, 4))
        )
        svg = f"""
        <svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
          <rect width="100%" height="100%" rx="16" fill="#eff6ff"/>
          <rect x="4" y="4" width="{width - 8}" height="{height - 8}" rx="13" fill="#dbeafe" opacity="0.75"/>
          <g stroke="#4f46e5" stroke-width="1.6" fill="none" opacity="0.36">{lines}</g>
          <g fill="#2563eb" opacity="0.28">{dots}</g>
          <g font-family="Verdana, Arial, sans-serif" font-size="30" font-weight="800" fill="#1d4ed8" letter-spacing="3">{''.join(chars)}</g>
        </svg>
        """
        encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
        return f"data:image/svg+xml;base64,{encoded}"
