"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ProjectOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ErrorState } from "@/components/ui/error-state";
import { CardGridSkeleton, ProjectCardSkeleton } from "@/components/ui/skeletons";
import { ApiError } from "@/lib/api-client";
import { knowledgeService } from "@/services/knowledge";
import { Project } from "@/types";

const { Paragraph, Text, Title } = Typography;

type ProjectStatusFilter = "ALL" | Project["status"];

type ProjectFormValues = {
  title: string;
  project_type: Project["project_type"];
  domain?: string;
  description: string;
  outcome?: string;
  technologies?: string;
  skills?: string;
  visibility: Project["visibility"];
  status: Project["status"];
};

const defaultProjectValues: ProjectFormValues = {
  title: "",
  project_type: "ACADEMIC",
  domain: "",
  description: "",
  outcome: "",
  technologies: "",
  skills: "",
  visibility: "PUBLIC",
  status: "IN_PROGRESS",
};

const statusOptions: { label: string; value: ProjectStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProjectsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProjectsContent() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ProjectFormValues>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getProjects({ domain: domainFilter || undefined });
      setProjects(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load campus projects.";
      setError(msg);
      setErrorStatus(err instanceof ApiError ? err.status : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [domainFilter]);

  const domains = useMemo(() => {
    const values = projects.map((project) => project.domain).filter((domain): domain is string => Boolean(domain));
    return Array.from(new Set(values)).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      const matchesSearch =
        !needle ||
        [project.title, project.description, project.domain, project.outcome]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "IN_PROGRESS").length,
      completed: projects.filter((project) => project.status === "COMPLETED").length,
      contributors: projects.reduce((sum, project) => sum + project.contributors.length, 0),
    }),
    [projects],
  );

  const handleCreate = async (values: ProjectFormValues) => {
    try {
      setCreating(true);
      await knowledgeService.createProject({
        title: values.title,
        project_type: values.project_type,
        domain: values.domain,
        description: values.description,
        outcome: values.outcome,
        technologies: splitCsv(values.technologies).map((name) => ({
          name,
          normalized_name: name.toLowerCase(),
          category: null,
        })) as Project["technologies"],
        skills: splitCsv(values.skills).map((name) => ({
          name,
          skill_id: "",
          category: null,
        })) as Project["skills"],
        visibility: values.visibility,
        status: values.status,
      });
      setIsModalOpen(false);
      form.resetFields();
      message.success("Project created");
      fetchProjects();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Error creating project.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-page px-6 py-8 md:px-10">
      <div className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="page-heading-icon">
            <FolderOpenOutlined />
          </span>
          <div>
            <Title level={2} className="!m-0 !text-2xl">
              Campus Projects
            </Title>
            <Text type="secondary">
              {loading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""} in repository`}
            </Text>
          </div>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          New Project
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Projects" value={stats.total} prefix={<ProjectOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="In Progress" value={stats.active} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#2563eb" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#16a34a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Contributors" value={stats.contributors} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <div className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px_auto]">
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search projects by title, description, domain, or outcome..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select
          size="large"
          value={domainFilter}
          onChange={setDomainFilter}
          options={[
            { value: "", label: "All Domains" },
            ...domains.map((domain) => ({ value: domain, label: domain })),
            { value: "IoT", label: "IoT & Embedded Systems" },
            { value: "AI", label: "AI & Machine Learning" },
            { value: "Robotics", label: "Robotics" },
            { value: "Software", label: "Software" },
            { value: "Security", label: "Cybersecurity" },
            { value: "Quantum", label: "Quantum Computing" },
          ]}
        />
        <Segmented
          size="large"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as ProjectStatusFilter)}
          options={statusOptions}
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={6} Skeleton={ProjectCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchProjects} />
      ) : filtered.length === 0 ? (
        <Card>
          <Empty description={searchQuery ? `No projects matching "${searchQuery}"` : "No campus projects found"}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Create Project
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {filtered.map((project) => (
            <Col key={project.id} xs={24} md={12} xl={8}>
              <ProjectCard project={project} onView={() => setSelectedProject(project)} />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title="Create Campus Project"
        footer={null}
        width={760}
        destroyOnClose
      >
        <Form<ProjectFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={defaultProjectValues}
          onFinish={handleCreate}
          className="pt-2"
        >
          <Form.Item name="title" label="Project Title" rules={[{ required: true, message: "Enter project title" }]}>
            <Input placeholder="Autonomous Campus Delivery Rover" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="project_type" label="Type">
                <Select options={[
                  { value: "ACADEMIC", label: "Academic" },
                  { value: "RESEARCH", label: "Research" },
                  { value: "CAPSTONE", label: "Capstone" },
                  { value: "ENTREPRENEURIAL", label: "Entrepreneurial" },
                  { value: "OPEN_SOURCE", label: "Open Source" },
                  { value: "PERSONAL", label: "Personal" },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Status">
                <Select options={[
                  { value: "PROPOSED", label: "Proposed" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "PAUSED", label: "Paused" },
                  { value: "ARCHIVED", label: "Archived" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="domain" label="Domain">
            <Input placeholder="IoT & Embedded Systems" />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Enter project description" }]}>
            <Input.TextArea rows={4} placeholder="Detailed project summary..." />
          </Form.Item>

          <Form.Item name="outcome" label="Outcome / Results">
            <Input placeholder="95% accurate TinyML model deployed on ESP32" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="technologies" label="Technologies">
                <Input placeholder="ESP32, Python, FastAPI" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="skills" label="Skills">
                <Input placeholder="Embedded Systems, Circuit Design" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button htmlType="submit" type="primary" loading={creating}>
              Create Project
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!selectedProject}
        onCancel={() => setSelectedProject(null)}
        title={selectedProject?.title}
        footer={null}
        width={820}
      >
        {selectedProject && <ProjectDetails project={selectedProject} />}
      </Modal>
    </div>
  );
}

function ProjectCard({ project, onView }: { project: Project; onView: () => void }) {
  const percent = project.status === "COMPLETED" ? 100 : project.status === "IN_PROGRESS" ? 62 : project.status === "PROPOSED" ? 18 : 0;
  const color = statusColor(project.status);

  return (
    <Card
      hoverable
      className="h-full project-card"
      styles={{ body: { height: "100%", padding: 24 } }}
      actions={[
        <Tooltip key="contributors" title="Contributors">
          <span><TeamOutlined /> {project.contributors.length}</span>
        </Tooltip>,
        <Button key="view" type="link" onClick={onView} className="font-bold">
          View Details <ArrowRightOutlined />
        </Button>,
      ]}
    >
      <div className="flex h-full flex-col gap-4">
        <Space wrap>
          <Tag color="blue">{project.domain || project.project_type}</Tag>
          <Tag color={color}>{project.status.replace(/_/g, " ")}</Tag>
        </Space>

        <div>
          <Title level={5} className="!mb-2">
            {project.title}
          </Title>
          <Paragraph type="secondary" ellipsis={{ rows: 3 }} className="!mb-0">
            {project.description}
          </Paragraph>
        </div>

        <Progress percent={percent} showInfo={false} strokeColor={progressColor(project.status)} trailColor="#f1f5f9" />

        <Space wrap size={[6, 6]} className="mt-auto">
          {project.technologies.slice(0, 4).map((item) => (
            <Tag key={item.name}>{item.name}</Tag>
          ))}
          {project.technologies.length > 4 && <Tag>+{project.technologies.length - 4}</Tag>}
        </Space>
      </div>
    </Card>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space wrap>
        <Tag color="blue">{project.domain || project.project_type}</Tag>
        <Tag color={statusColor(project.status)}>{project.status.replace(/_/g, " ")}</Tag>
        <Tag>{project.visibility.replace(/_/g, " ")}</Tag>
      </Space>

      <Paragraph className="!mb-0">{project.description}</Paragraph>

      <Descriptions bordered size="small" column={1}>
        {project.problem_statement && <Descriptions.Item label="Problem Statement">{project.problem_statement}</Descriptions.Item>}
        {project.methodology && <Descriptions.Item label="Methodology">{project.methodology}</Descriptions.Item>}
        {project.outcome && <Descriptions.Item label="Outcome">{project.outcome}</Descriptions.Item>}
        <Descriptions.Item label="Technologies">
          <Space wrap>{project.technologies.map((item) => <Tag key={item.name}>{item.name}</Tag>)}</Space>
        </Descriptions.Item>
        <Descriptions.Item label="Skills">
          <Space wrap>{project.skills.map((item) => <Tag color="blue" key={item.name}>{item.name}</Tag>)}</Space>
        </Descriptions.Item>
      </Descriptions>

      <div>
        <Text strong>Contributors</Text>
        <div className="mt-3 space-y-2">
          {project.contributors.length === 0 ? (
            <Text type="secondary">No contributors listed.</Text>
          ) : (
            project.contributors.map((contributor) => (
              <div key={contributor.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Space>
                  <Avatar>{(contributor.full_name || contributor.email || "U").slice(0, 2).toUpperCase()}</Avatar>
                  <div>
                    <Text strong>{contributor.full_name || contributor.email || "Campus User"}</Text>
                    {contributor.contribution_description && (
                      <div><Text type="secondary">{contributor.contribution_description}</Text></div>
                    )}
                  </div>
                </Space>
                <Tag>{contributor.role.replace(/_/g, " ")}</Tag>
              </div>
            ))
          )}
        </div>
      </div>
    </Space>
  );
}

function splitCsv(value?: string) {
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function statusColor(status: Project["status"]) {
  if (status === "COMPLETED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  if (status === "ARCHIVED") return "default";
  if (status === "PAUSED") return "gold";
  return "cyan";
}

function progressColor(status: Project["status"]) {
  if (status === "COMPLETED") return "#16a34a";
  if (status === "IN_PROGRESS") return "#2563eb";
  if (status === "PAUSED") return "#f59e0b";
  return "#94a3b8";
}
