import io
from pathlib import Path
import docx


def create_minimal_pdf_bytes(title: str, text_content: str) -> bytes:
    """Create minimal valid PDF binary with standard header and content."""
    pdf_template = (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        b"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
        b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>> >> endobj\n"
        b"4 0 obj <</Length " + str(len(text_content) + 50).encode() + b">> stream\n"
        b"BT /F1 12 Tf 50 700 Td (" + text_content.encode("ascii", "ignore") + b") Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000240 00000 n \n"
        b"0000000350 00000 n \n"
        b"trailer <</Size 6 /Root 1 0 R>>\n"
        b"startxref\n430\n%%EOF"
    )
    return pdf_template


def create_docx_bytes(title: str, paragraphs: list) -> bytes:
    """Create valid DOCX binary file bytes using python-docx."""
    doc = docx.Document()
    doc.add_heading(title, 0)
    for p in paragraphs:
        doc.add_paragraph(p)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def generate_all_fixtures():
    target_dir = Path(__file__).parent / "resumes"
    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. Full Stack PDF
    full_stack_pdf = create_minimal_pdf_bytes(
        "Alex Chen Resume",
        "Alex Chen. Full Stack Developer. Skills: Python, React, PostgreSQL, Docker. Project: Smart Campus Portal using Python and React.",
    )
    (target_dir / "student_full_stack.pdf").write_bytes(full_stack_pdf)

    # 2. IoT DOCX
    iot_docx = create_docx_bytes(
        "Taylor Smith Resume",
        [
            "Taylor Smith - IoT & Embedded Systems",
            "Email: taylor.smith@example.edu | Phone: 555-0199",
            "Skills: ESP32, C++, Microcontrollers, FreeRTOS, MQTT, Sensor Networks",
            "Project: Smart Greenhouse Monitoring System",
            "Built an automated IoT sensor mesh using ESP32 and MQTT protocol for real-time climate telemetry.",
        ],
    )
    (target_dir / "student_iot.docx").write_bytes(iot_docx)

    # 3. Minimal PDF
    minimal_pdf = create_minimal_pdf_bytes("Jordan Doe", "Jordan Doe. Student. Python developer.")
    (target_dir / "student_minimal.pdf").write_bytes(minimal_pdf)


if __name__ == "__main__":
    generate_all_fixtures()
