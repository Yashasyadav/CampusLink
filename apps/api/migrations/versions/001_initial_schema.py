"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-05 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='STUDENT'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ACTIVE'),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
        sa.UniqueConstraint('email', name=op.f('uq_users_email'))
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    op.create_index(op.f('ix_users_status'), 'users', ['status'], unique=False)

    # 3. Create profiles table
    op.create_table(
        'profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('profile_photo_url', sa.String(length=1024), nullable=True),
        sa.Column('department', sa.String(length=255), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('designation', sa.String(length=255), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('github_url', sa.String(length=512), nullable=True),
        sa.Column('linkedin_url', sa.String(length=512), nullable=True),
        sa.Column('portfolio_url', sa.String(length=512), nullable=True),
        sa.Column('searchable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('contact_visibility', sa.String(length=50), nullable=False, server_default='CONNECTIONS_ONLY'),
        sa.Column('show_email', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('show_phone', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('show_social_links', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('profile_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_profiles_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_profiles')),
        sa.UniqueConstraint('user_id', name=op.f('uq_profiles_user_id'))
    )
    op.create_index(op.f('ix_profiles_department'), 'profiles', ['department'], unique=False)
    op.create_index(op.f('ix_profiles_searchable'), 'profiles', ['searchable'], unique=False)

    # 4. Create skills table
    op.create_table(
        'skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('normalized_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_skills')),
        sa.UniqueConstraint('normalized_name', name=op.f('uq_skills_normalized_name'))
    )
    op.create_index(op.f('ix_skills_category'), 'skills', ['category'], unique=False)
    op.create_index(op.f('ix_skills_normalized_name'), 'skills', ['normalized_name'], unique=True)

    # 5. Create user_skills table
    op.create_table(
        'user_skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('proficiency', sa.String(length=50), nullable=False, server_default='BEGINNER'),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='USER'),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], name=op.f('fk_user_skills_skill_id_skills'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_skills_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_skills')),
        sa.UniqueConstraint('user_id', 'skill_id', name='uq_user_skill')
    )

    # 6. Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('domain', sa.String(length=100), nullable=True),
        sa.Column('problem_statement', sa.Text(), nullable=True),
        sa.Column('methodology', sa.Text(), nullable=True),
        sa.Column('outcome', sa.Text(), nullable=True),
        sa.Column('visibility', sa.String(length=50), nullable=False, server_default='CAMPUS_ONLY'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='IN_PROGRESS'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('github_url', sa.String(length=512), nullable=True),
        sa.Column('demo_url', sa.String(length=512), nullable=True),
        sa.Column('paper_url', sa.String(length=512), nullable=True),
        sa.Column('video_url', sa.String(length=512), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_projects_created_by_users'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_projects')),
        sa.UniqueConstraint('slug', name=op.f('uq_projects_slug'))
    )
    op.create_index(op.f('ix_projects_domain'), 'projects', ['domain'], unique=False)
    op.create_index(op.f('ix_projects_slug'), 'projects', ['slug'], unique=True)

    # 7. Create project_contributors table
    op.create_table(
        'project_contributors',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='CONTRIBUTOR'),
        sa.Column('contribution_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name=op.f('fk_project_contributors_project_id_projects'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_project_contributors_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_project_contributors')),
        sa.UniqueConstraint('project_id', 'user_id', name='uq_project_contributor')
    )

    # 8. Create project_skills table
    op.create_table(
        'project_skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name=op.f('fk_project_skills_project_id_projects'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], name=op.f('fk_project_skills_skill_id_skills'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_project_skills')),
        sa.UniqueConstraint('project_id', 'skill_id', name='uq_project_skill')
    )

    # 9. Create project_technologies table
    op.create_table(
        'project_technologies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('normalized_name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name=op.f('fk_project_technologies_project_id_projects'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_project_technologies')),
        sa.UniqueConstraint('project_id', 'normalized_name', name='uq_project_technology')
    )
    op.create_index(op.f('ix_project_technologies_normalized_name'), 'project_technologies', ['normalized_name'], unique=False)

    # 10. Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False, server_default='RESUME'),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('storage_key', sa.String(length=1024), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('processing_status', sa.String(length=50), nullable=False, server_default='UPLOADED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name=op.f('fk_documents_owner_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_documents'))
    )
    op.create_index(op.f('ix_documents_owner_id'), 'documents', ['owner_id'], unique=False)
    op.create_index(op.f('ix_documents_processing_status'), 'documents', ['processing_status'], unique=False)

    # 11. Create document_extractions table
    op.create_table(
        'document_extractions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('model_version', sa.String(length=50), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('extraction_status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], name=op.f('fk_document_extractions_document_id_documents'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], name=op.f('fk_document_extractions_reviewed_by_users'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_document_extractions')),
        sa.UniqueConstraint('document_id', name=op.f('uq_document_extractions_document_id'))
    )

    # 12. Create research_items table
    op.create_table(
        'research_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('abstract', sa.Text(), nullable=True),
        sa.Column('research_area', sa.String(length=150), nullable=True),
        sa.Column('publication_url', sa.String(length=512), nullable=True),
        sa.Column('paper_url', sa.String(length=512), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PUBLISHED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name=op.f('fk_research_items_owner_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_research_items'))
    )
    op.create_index(op.f('ix_research_items_owner_id'), 'research_items', ['owner_id'], unique=False)
    op.create_index(op.f('ix_research_items_research_area'), 'research_items', ['research_area'], unique=False)

    # 13. Create facilities table
    op.create_table(
        'facilities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('facility_type', sa.String(length=100), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('building', sa.String(length=100), nullable=True),
        sa.Column('floor', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('capabilities', sa.Text(), nullable=True),
        sa.Column('responsible_user_id', sa.UUID(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='OPERATIONAL'),
        sa.Column('availability_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['responsible_user_id'], ['users.id'], name=op.f('fk_facilities_responsible_user_id_users'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_facilities'))
    )
    op.create_index(op.f('ix_facilities_facility_type'), 'facilities', ['facility_type'], unique=False)
    op.create_index(op.f('ix_facilities_location'), 'facilities', ['location'], unique=False)

    # 14. Create equipment table
    op.create_table(
        'equipment',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('facility_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('capability', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='OPERATIONAL'),
        sa.Column('availability_status', sa.String(length=50), nullable=False, server_default='AVAILABLE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['facility_id'], ['facilities.id'], name=op.f('fk_equipment_facility_id_facilities'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_equipment'))
    )
    op.create_index(op.f('ix_equipment_category'), 'equipment', ['category'], unique=False)

    # 15. Create problem_solutions table
    op.create_table(
        'problem_solutions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=True),
        sa.Column('project_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('problem', sa.Text(), nullable=False),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('root_cause', sa.Text(), nullable=True),
        sa.Column('solution', sa.Text(), nullable=False),
        sa.Column('technologies', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('domain', sa.String(length=100), nullable=True),
        sa.Column('outcome', sa.Text(), nullable=True),
        sa.Column('visibility', sa.String(length=50), nullable=False, server_default='CAMPUS_ONLY'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_problem_solutions_author_id_users'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name=op.f('fk_problem_solutions_project_id_projects'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_problem_solutions'))
    )
    op.create_index(op.f('ix_problem_solutions_author_id'), 'problem_solutions', ['author_id'], unique=False)
    op.create_index(op.f('ix_problem_solutions_domain'), 'problem_solutions', ['domain'], unique=False)

    # 16. Create embeddings table with pgvector Vector(768)
    op.create_table(
        'embeddings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('chunk_text', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(768), nullable=False),
        sa.Column('embedding_model', sa.String(length=100), nullable=False, server_default='text-embedding-004'),
        sa.Column('chunk_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_embeddings'))
    )
    op.create_index(op.f('ix_embeddings_entity_type'), 'embeddings', ['entity_type'], unique=False)
    op.create_index(op.f('ix_embeddings_entity_id'), 'embeddings', ['entity_id'], unique=False)
    op.create_index('ix_embeddings_entity', 'embeddings', ['entity_type', 'entity_id'], unique=False)

    # 17. Create connections table with check constraint
    op.create_table(
        'connections',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('requester_id', sa.UUID(), nullable=False),
        sa.Column('recipient_id', sa.UUID(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('requester_id <> recipient_id', name=op.f('ck_connections_ck_no_self_connection')),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], name=op.f('fk_connections_recipient_id_users'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], name=op.f('fk_connections_requester_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_connections')),
        sa.UniqueConstraint('requester_id', 'recipient_id', name='uq_connection_pair')
    )
    op.create_index(op.f('ix_connections_recipient_id'), 'connections', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_connections_requester_id'), 'connections', ['requester_id'], unique=False)
    op.create_index(op.f('ix_connections_status'), 'connections', ['status'], unique=False)

    # 18. Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('actor_user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=True),
        sa.Column('entity_id', sa.UUID(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], name=op.f('fk_audit_logs_actor_user_id_users'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs'))
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_actor_user_id'), 'audit_logs', ['actor_user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_id'), 'audit_logs', ['entity_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('connections')
    op.drop_table('embeddings')
    op.drop_table('problem_solutions')
    op.drop_table('equipment')
    op.drop_table('facilities')
    op.drop_table('research_items')
    op.drop_table('document_extractions')
    op.drop_table('documents')
    op.drop_table('project_technologies')
    op.drop_table('project_skills')
    op.drop_table('project_contributors')
    op.drop_table('projects')
    op.drop_table('user_skills')
    op.drop_table('skills')
    op.drop_table('profiles')
    op.drop_table('users')
    op.execute("DROP EXTENSION IF EXISTS vector;")
