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
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  LinkOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ErrorState } from "@/components/ui/error-state";
import { CardGridSkeleton, ResearchCardSkeleton } from "@/components/ui/skeletons";
import { ApiError } from "@/lib/api-client";
import { knowledgeService } from "@/services/knowledge";
import { ResearchItem } from "@/types";

const { Paragraph, Text, Title } = Typography;

type ResearchStatusFilter = "ALL" | ResearchItem["status"];

type ResearchFormValues = {
  title: string;
  abstract?: string;
  research_area?: string;
  publication_type: ResearchItem["publication_type"];
  publication_venue?: string;
  doi?: string;
  publication_url?: string;
  status: ResearchItem["status"];
  visibility: ResearchItem["visibility"];
};

const defaultResearchValues: ResearchFormValues = {
  title: "",
  abstract: "",
  research_area: "",
  publication_type: "JOURNAL",
  publication_venue: "",
  doi: "",
  publication_url: "",
  status: "PUBLISHED",
  visibility: "PUBLIC",
};

const statusOptions: { label: string; value: ResearchStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Draft", value: "DRAFT" },
];

export default function ResearchPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ResearchContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ResearchContent() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ResearchFormValues>();
  const [researchList, setResearchList] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResearchStatusFilter>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getResearch({ research_area: areaFilter || undefined });
      setResearchList(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load research publications.";
      setError(msg);
      setErrorStatus(err instanceof ApiError ? err.status : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, [areaFilter]);

  const researchAreas = useMemo(() => {
    const values = researchList
      .map((item) => item.research_area)
      .filter((area): area is string => Boolean(area));
    return Array.from(new Set(values)).sort();
  }, [researchList]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return researchList.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesSearch =
        !needle ||
        [item.title, item.abstract, item.research_area, item.publication_venue, item.doi]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [researchList, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: researchList.length,
      published: researchList.filter((item) => item.status === "PUBLISHED").length,
      submitted: researchList.filter((item) => item.status === "SUBMITTED").length,
      authors: researchList.reduce((sum, item) => sum + item.authors.length, 0),
    }),
    [researchList],
  );

  const handleCreate = async (values: ResearchFormValues) => {
    try {
      setCreating(true);
      await knowledgeService.createResearch({
        title: values.title,
        abstract: values.abstract,
        research_area: values.research_area,
        publication_type: values.publication_type,
        publication_venue: values.publication_venue,
        doi: values.doi || undefined,
        publication_url: values.publication_url || undefined,
        status: values.status,
        visibility: values.visibility,
      });
      setIsModalOpen(false);
      form.resetFields();
      message.success("Publication added");
      fetchResearch();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Failed to create research.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-page px-6 py-8 md:px-10">
      <div className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="page-heading-icon research-heading-icon">
            <BookOutlined />
          </span>
          <div>
            <Title level={2} className="!m-0 !text-2xl">
              Research & Publications
            </Title>
            <Text type="secondary">
              {loading ? "Loading..." : `${researchList.length} publication${researchList.length !== 1 ? "s" : ""} in repository`}
            </Text>
          </div>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Publication
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Publications" value={stats.total} prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Published" value={stats.published} prefix={<ReadOutlined />} valueStyle={{ color: "#16a34a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Submitted" value={stats.submitted} prefix={<CalendarOutlined />} valueStyle={{ color: "#2563eb" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Authors" value={stats.authors} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <div className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px_auto]">
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search by title, abstract, author signal, venue, DOI, or research area..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select
          size="large"
          value={areaFilter}
          onChange={setAreaFilter}
          options={[
            { value: "", label: "All Research Areas" },
            ...researchAreas.map((area) => ({ value: area, label: area })),
            { value: "AI/ML", label: "AI & Machine Learning" },
            { value: "Security", label: "Cybersecurity" },
            { value: "IoT", label: "IoT & Embedded Systems" },
            { value: "Quantum", label: "Quantum Computing" },
            { value: "Robotics", label: "Robotics" },
          ]}
        />
        <Segmented
          size="large"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as ResearchStatusFilter)}
          options={statusOptions}
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={6} Skeleton={ResearchCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchResearch} />
      ) : filtered.length === 0 ? (
        <Card>
          <Empty description={searchQuery ? `No publications for "${searchQuery}"` : "No publications found"}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add Publication
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {filtered.map((item) => (
            <Col key={item.id} xs={24} md={12} xl={8}>
              <ResearchCard item={item} onView={() => setSelectedResearch(item)} />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title="Add Research Publication"
        footer={null}
        width={760}
        destroyOnClose
      >
        <Form<ResearchFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={defaultResearchValues}
          onFinish={handleCreate}
          className="pt-2"
        >
          <Form.Item name="title" label="Publication Title" rules={[{ required: true, message: "Enter publication title" }]}>
            <Input placeholder="Enter full publication title" />
          </Form.Item>

          <Form.Item name="abstract" label="Abstract">
            <Input.TextArea rows={4} placeholder="Research abstract or summary..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="research_area" label="Research Area">
                <Input placeholder="AI & Machine Learning" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="publication_type" label="Publication Type">
                <Select options={[
                  { value: "JOURNAL", label: "Journal Article" },
                  { value: "JOURNAL_ARTICLE", label: "Journal Article" },
                  { value: "CONFERENCE", label: "Conference Paper" },
                  { value: "WORKSHOP", label: "Workshop" },
                  { value: "THESIS", label: "Thesis" },
                  { value: "DISSERTATION", label: "Dissertation" },
                  { value: "PREPRINT", label: "Preprint" },
                  { value: "TECHNICAL_REPORT", label: "Technical Report" },
                  { value: "OTHER", label: "Other" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="publication_venue" label="Publication Venue">
                <Input placeholder="IEEE TPAMI" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="doi" label="DOI">
                <Input placeholder="10.1109/..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="publication_url" label="Publication URL">
            <Input type="url" placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Status">
                <Select options={[
                  { value: "DRAFT", label: "Draft" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "PUBLISHED", label: "Published" },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="visibility" label="Visibility">
                <Select options={[
                  { value: "PUBLIC", label: "Public" },
                  { value: "CAMPUS_ONLY", label: "Campus Only" },
                  { value: "PRIVATE", label: "Private" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button htmlType="submit" type="primary" loading={creating}>
              Add Publication
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!selectedResearch}
        onCancel={() => setSelectedResearch(null)}
        title={selectedResearch?.title}
        footer={null}
        width={820}
      >
        {selectedResearch && <ResearchDetails item={selectedResearch} />}
      </Modal>
    </div>
  );
}

function ResearchCard({ item, onView }: { item: ResearchItem; onView: () => void }) {
  const url = item.publication_url || item.paper_url;

  return (
    <Card hoverable className="h-full research-card" styles={{ body: { height: "100%", padding: 28 } }}>
      <div className="research-card-body">
        <Space wrap size={[8, 8]} className="research-card-tags">
          <Tag color={publicationColor(item.publication_type)}>
            {item.publication_type.replace(/_/g, " ")}
          </Tag>
          <Tag color={statusColor(item.status)}>{item.status}</Tag>
          {item.research_area && <Tag>{item.research_area}</Tag>}
        </Space>

        <div className="research-card-main">
          <Title level={5} className="!mb-2">
            {item.title}
          </Title>
          {item.abstract && (
            <Paragraph type="secondary" ellipsis={{ rows: 3 }} className="!mb-0">
              {item.abstract}
            </Paragraph>
          )}
        </div>

        <div className="research-card-meta">
          <div className="research-card-venue">
            {item.publication_venue ? (
              <Text italic type="secondary">
                {item.publication_venue}
              </Text>
            ) : (
              <Text type="secondary">Venue not set</Text>
            )}
          </div>
          <div className="flex min-h-7 items-center justify-between">
            <Text type="secondary">
              <CalendarOutlined /> {item.publication_date ? new Date(item.publication_date).getFullYear() : "Year not set"}
            </Text>
            {item.doi && <Tag>DOI</Tag>}
          </div>
        </div>

        <div className="research-card-footer">
          <Text type="secondary">
            <TeamOutlined /> {item.authors.length}
          </Text>
          <Button type="link" onClick={onView} className="p-0 font-bold">
            View Details
          </Button>
          {url ? (
            <Button type="link" href={url} target="_blank" className="p-0 font-bold">
              Open <LinkOutlined />
            </Button>
          ) : (
            <Text type="secondary">No link</Text>
          )}
        </div>
      </div>
    </Card>
  );
}

function ResearchDetails({ item }: { item: ResearchItem }) {
  const url = item.publication_url || item.paper_url;

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space wrap>
        <Tag color={publicationColor(item.publication_type)}>{item.publication_type.replace(/_/g, " ")}</Tag>
        <Tag color={statusColor(item.status)}>{item.status}</Tag>
        <Tag>{item.visibility.replace(/_/g, " ")}</Tag>
        {item.research_area && <Tag color="blue">{item.research_area}</Tag>}
      </Space>

      {item.abstract ? <Paragraph className="!mb-0">{item.abstract}</Paragraph> : <Text type="secondary">No abstract provided.</Text>}

      <Descriptions bordered size="small" column={1}>
        {item.publication_venue && <Descriptions.Item label="Venue">{item.publication_venue}</Descriptions.Item>}
        {item.publication_date && <Descriptions.Item label="Publication Date">{new Date(item.publication_date).toLocaleDateString()}</Descriptions.Item>}
        {item.doi && <Descriptions.Item label="DOI">{item.doi}</Descriptions.Item>}
        {url && (
          <Descriptions.Item label="Publication Link">
            <Button type="link" href={url} target="_blank" className="p-0">
              Open publication <LinkOutlined />
            </Button>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <Text strong>Authors</Text>
        <div className="mt-3 space-y-2">
          {item.authors.length === 0 ? (
            <Text type="secondary">No authors listed.</Text>
          ) : (
            item.authors.map((author) => (
              <div key={author.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Space>
                  <Avatar>{(author.full_name || author.email || "A").slice(0, 2).toUpperCase()}</Avatar>
                  <div>
                    <Text strong>{author.full_name || author.email || "Research Author"}</Text>
                    <div><Text type="secondary">Author #{author.author_order}</Text></div>
                  </div>
                </Space>
              </div>
            ))
          )}
        </div>
      </div>
    </Space>
  );
}

function publicationColor(type: ResearchItem["publication_type"]) {
  if (type === "CONFERENCE") return "blue";
  if (type === "WORKSHOP") return "purple";
  if (type === "THESIS" || type === "DISSERTATION") return "geekblue";
  if (type === "PREPRINT") return "gold";
  if (type === "TECHNICAL_REPORT") return "default";
  return "green";
}

function statusColor(status: ResearchItem["status"]) {
  if (status === "PUBLISHED") return "green";
  if (status === "SUBMITTED") return "blue";
  return "default";
}
