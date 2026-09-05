"""002_campus_knowledge

Revision ID: 002_campus_knowledge
Revises: 001_initial_schema
Create Date: 2026-09-05 23:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_campus_knowledge'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to projects table
    op.add_column('projects', sa.Column('project_type', sa.String(length=50), nullable=False, server_default='ACADEMIC'))
    op.add_column('projects', sa.Column('provenance', sa.String(length=50), nullable=False, server_default='MANUAL'))
    op.create_index(op.f('ix_projects_project_type'), 'projects', ['project_type'], unique=False)
    op.create_index(op.f('ix_projects_visibility'), 'projects', ['visibility'], unique=False)
    op.create_index(op.f('ix_projects_status'), 'projects', ['status'], unique=False)

    # 2. Add columns to research_items table
    op.add_column('research_items', sa.Column('publication_type', sa.String(length=50), nullable=False, server_default='JOURNAL'))
    op.add_column('research_items', sa.Column('publication_venue', sa.String(length=255), nullable=True))
    op.add_column('research_items', sa.Column('publication_date', sa.Date(), nullable=True))
    op.add_column('research_items', sa.Column('doi', sa.String(length=100), nullable=True))
    op.add_column('research_items', sa.Column('visibility', sa.String(length=50), nullable=False, server_default='CAMPUS_ONLY'))
    op.add_column('research_items', sa.Column('provenance', sa.String(length=50), nullable=False, server_default='MANUAL'))
    op.create_index(op.f('ix_research_items_publication_type'), 'research_items', ['publication_type'], unique=False)
    op.create_index(op.f('ix_research_items_visibility'), 'research_items', ['visibility'], unique=False)
    op.create_index(op.f('ix_research_items_status'), 'research_items', ['status'], unique=False)

    # 3. Create research_authors table
    op.create_table(
        'research_authors',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('research_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('author_order', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['research_id'], ['research_items.id'], name=op.f('fk_research_authors_research_id_research_items'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_research_authors_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_research_authors')),
        sa.UniqueConstraint('research_id', 'user_id', name='uq_research_author')
    )
    op.create_index(op.f('ix_research_authors_research_id'), 'research_authors', ['research_id'], unique=False)
    op.create_index(op.f('ix_research_authors_user_id'), 'research_authors', ['user_id'], unique=False)

    # 4. Add columns to facilities table
    op.add_column('facilities', sa.Column('department', sa.String(length=255), nullable=True))
    op.add_column('facilities', sa.Column('contact_email', sa.String(length=255), nullable=True))
    op.add_column('facilities', sa.Column('operating_hours', sa.String(length=255), nullable=True))
    op.add_column('facilities', sa.Column('visibility', sa.String(length=50), nullable=False, server_default='CAMPUS_ONLY'))
    op.create_index(op.f('ix_facilities_visibility'), 'facilities', ['visibility'], unique=False)

    # 5. Add columns to equipment table
    op.add_column('equipment', sa.Column('visibility', sa.String(length=50), nullable=False, server_default='CAMPUS_ONLY'))
    op.create_index(op.f('ix_equipment_visibility'), 'equipment', ['visibility'], unique=False)
    op.create_index(op.f('ix_equipment_status'), 'equipment', ['status'], unique=False)
    op.create_index(op.f('ix_equipment_availability_status'), 'equipment', ['availability_status'], unique=False)

    # 6. Add columns to problem_solutions table
    op.add_column('problem_solutions', sa.Column('status', sa.String(length=50), nullable=False, server_default='PUBLISHED'))
    op.add_column('problem_solutions', sa.Column('lessons_learned', sa.Text(), nullable=True))
    op.add_column('problem_solutions', sa.Column('research_id', sa.UUID(), nullable=True))
    op.add_column('problem_solutions', sa.Column('provenance', sa.String(length=50), nullable=False, server_default='MANUAL'))
    op.create_foreign_key(op.f('fk_problem_solutions_research_id_research_items'), 'problem_solutions', 'research_items', ['research_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_problem_solutions_status'), 'problem_solutions', ['status'], unique=False)
    op.create_index(op.f('ix_problem_solutions_visibility'), 'problem_solutions', ['visibility'], unique=False)

    # 7. Create problem_solution_skills table
    op.create_table(
        'problem_solution_skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('problem_solution_id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['problem_solution_id'], ['problem_solutions.id'], name=op.f('fk_ps_skills_ps_id'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], name=op.f('fk_ps_skills_skill_id'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_problem_solution_skills')),
        sa.UniqueConstraint('problem_solution_id', 'skill_id', name='uq_problem_solution_skill')
    )

    # 8. Create problem_solution_technologies table
    op.create_table(
        'problem_solution_technologies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('problem_solution_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('normalized_name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['problem_solution_id'], ['problem_solutions.id'], name=op.f('fk_ps_tech_ps_id'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_problem_solution_technologies')),
        sa.UniqueConstraint('problem_solution_id', 'normalized_name', name='uq_problem_solution_technology')
    )


def downgrade() -> None:
    op.drop_table('problem_solution_technologies')
    op.drop_table('problem_solution_skills')
    op.drop_constraint(op.f('fk_problem_solutions_research_id_research_items'), 'problem_solutions', type_='foreignkey')
    op.drop_column('problem_solutions', 'provenance')
    op.drop_column('problem_solutions', 'research_id')
    op.drop_column('problem_solutions', 'lessons_learned')
    op.drop_column('problem_solutions', 'status')

    op.drop_column('equipment', 'visibility')
    op.drop_column('facilities', 'visibility')
    op.drop_column('facilities', 'operating_hours')
    op.drop_column('facilities', 'contact_email')
    op.drop_column('facilities', 'department')

    op.drop_table('research_authors')
    op.drop_column('research_items', 'provenance')
    op.drop_column('research_items', 'visibility')
    op.drop_column('research_items', 'doi')
    op.drop_column('research_items', 'publication_date')
    op.drop_column('research_items', 'publication_venue')
    op.drop_column('research_items', 'publication_type')

    op.drop_column('projects', 'provenance')
    op.drop_column('projects', 'project_type')
