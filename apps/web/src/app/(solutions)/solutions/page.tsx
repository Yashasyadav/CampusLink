"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Descriptions, Empty, Input, Modal, Select, Space, Tag, Typography } from "antd";
import { ArrowRightOutlined, BugOutlined, BulbOutlined, CheckCircleOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ErrorState } from "@/components/ui/error-state";
import { CardGridSkeleton, SolutionCardSkeleton } from "@/components/ui/skeletons";
import { ApiError } from "@/lib/api-client";
import { knowledgeService } from "@/services/knowledge";
import { ProblemSolution } from "@/types";

const { Paragraph, Text, Title } = Typography;

const emptySolutionForm = {
  title: "",
  problem: "",
  symptoms: "",
  root_cause: "",
  solution: "",
  outcome: "",
  lessons_learned: "",
  domain: "",
  skills: "",
  technologies: "",
  status: "PUBLISHED",
  visibility: "PUBLIC",
};

export default function SolutionsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SolutionsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SolutionsContent() {
  const { message } = App.useApp();
  const [solutions, setSolutions] = useState<ProblemSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<ProblemSolution | null>(null);
  const [formData, setFormData] = useState(emptySolutionForm);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getSolutions({ domain: domainFilter || undefined });
      setSolutions(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load solutions.";
      setError(msg);
      setErrorStatus(err instanceof ApiError ? err.status : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, [domainFilter]);

  const filtered = useMemo(
    () =>
      solutions.filter((solution) =>
        [solution.title, solution.problem, solution.domain]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [solutions, searchQuery],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeService.createSolution({
        title: formData.title,
        problem: formData.problem,
        symptoms: formData.symptoms || undefined,
        root_cause: formData.root_cause || undefined,
        solution: formData.solution,
        outcome: formData.outcome || undefined,
        lessons_learned: formData.lessons_learned || undefined,
        domain: formData.domain || undefined,
        skills: splitCsv(formData.skills).map((name) => ({ name, skill_id: "" })) as ProblemSolution["skills"],
        technologies: splitCsv(formData.technologies).map((name) => ({ name, normalized_name: name.toLowerCase() })) as ProblemSolution["technologies"],
        status: formData.status as ProblemSolution["status"],
        visibility: formData.visibility as ProblemSolution["visibility"],
      });
      setIsModalOpen(false);
      setFormData(emptySolutionForm);
      message.success("Solution recorded");
      fetchSolutions();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Failed to create solution.");
    }
  };

  return (
    <div className="max-w-page mx-auto px-6 md:px-10 py-8 space-y-8 animate-fade-in">
      <PageHeading
        icon={<BulbOutlined />}
        title="Problem / Solution Knowledge Base"
        subtitle={loading ? "Loading..." : `${solutions.length} solution${solutions.length !== 1 ? "s" : ""} in repository`}
        action={<Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Record Solution</Button>}
      />

      <Space.Compact className="w-full" size="large">
        <Input prefix={<SearchOutlined />} placeholder="Search by title, problem description, or domain..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <Select className="w-56" value={domainFilter} onChange={setDomainFilter} options={[
          { value: "", label: "All Domains" },
          { value: "IoT", label: "IoT & Embedded" },
          { value: "AI", label: "AI / ML" },
          { value: "Security", label: "Security" },
          { value: "Robotics", label: "Robotics" },
          { value: "Software", label: "Software" },
        ]} />
      </Space.Compact>

      {loading ? (
        <CardGridSkeleton count={6} Skeleton={SolutionCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchSolutions} />
      ) : filtered.length === 0 ? (
        <Card><Empty description="No solutions recorded yet"><Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Record Solution</Button></Empty></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((solution) => <SolutionCard key={solution.id} solution={solution} onView={() => setSelectedSolution(solution)} />)}
        </div>
      )}

      <Modal open={isModalOpen} onCancel={() => setIsModalOpen(false)} title="Record Problem Solution" footer={null} width={760} destroyOnClose>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <Field label="Title" required><Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Short, searchable title" /></Field>
          <Field label="Problem Description" required><Input.TextArea required rows={3} value={formData.problem} onChange={(e) => setFormData({ ...formData, problem: e.target.value })} placeholder="Describe the exact problem..." /></Field>
          <Field label="Symptoms Observed"><Input.TextArea rows={2} value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} placeholder="What error messages or behaviors did you see?" /></Field>
          <Field label="Root Cause"><Input value={formData.root_cause} onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })} placeholder="What caused the problem?" /></Field>
          <Field label="Solution" required><Input.TextArea required rows={3} value={formData.solution} onChange={(e) => setFormData({ ...formData, solution: e.target.value })} placeholder="Describe the exact steps to resolve the problem..." /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Outcome"><Input value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} placeholder="What changed after applying the fix?" /></Field>
            <Field label="Domain"><Input value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} placeholder="IoT, AI, Security" /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Technologies"><Input value={formData.technologies} onChange={(e) => setFormData({ ...formData, technologies: e.target.value })} placeholder="ESP32, MQTT, TensorFlow Lite" /></Field>
            <Field label="Skills"><Input value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="Embedded Systems, Debugging" /></Field>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button htmlType="submit" type="primary">Record Solution</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selectedSolution} onCancel={() => setSelectedSolution(null)} title={selectedSolution?.title} footer={null} width={760}>
        {selectedSolution && (
          <Space direction="vertical" size="middle" className="w-full">
            <Space wrap><Tag color="orange" icon={<BulbOutlined />}>Previous Solution</Tag>{selectedSolution.domain && <Tag>{selectedSolution.domain}</Tag>}</Space>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Problem"><Text><BugOutlined /> {selectedSolution.problem}</Text></Descriptions.Item>
              {selectedSolution.symptoms && <Descriptions.Item label="Symptoms">{selectedSolution.symptoms}</Descriptions.Item>}
              {selectedSolution.root_cause && <Descriptions.Item label="Root Cause">{selectedSolution.root_cause}</Descriptions.Item>}
              <Descriptions.Item label="Solution"><Text type="success"><CheckCircleOutlined /> {selectedSolution.solution}</Text></Descriptions.Item>
              {selectedSolution.outcome && <Descriptions.Item label="Outcome">{selectedSolution.outcome}</Descriptions.Item>}
              {selectedSolution.lessons_learned && <Descriptions.Item label="Lessons Learned">{selectedSolution.lessons_learned}</Descriptions.Item>}
            </Descriptions>
            <Space wrap>
              {selectedSolution.technologies.map((item) => <Tag key={item.name}>{item.name}</Tag>)}
              {selectedSolution.skills.map((item) => <Tag color="blue" key={item.name}>{item.name}</Tag>)}
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  );
}

function SolutionCard({ solution, onView }: { solution: ProblemSolution; onView: () => void }) {
  return (
    <Card className="h-full card-interactive shadow-card" styles={{ body: { height: "100%", padding: 24 } }}>
      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <Space wrap className="mb-3"><Tag color="orange" icon={<BulbOutlined />}>Previous Solution</Tag>{solution.domain && <Tag>{solution.domain}</Tag>}</Space>
          <Title level={5} className="!mb-3">{solution.title}</Title>
          <Text type="secondary" className="block !mb-1">Problem</Text>
          <Paragraph ellipsis={{ rows: 2 }} className="!mb-3">{solution.problem}</Paragraph>
          <Text type="secondary" className="block !mb-1">Solution</Text>
          <Paragraph ellipsis={{ rows: 2 }} className="!mb-3">{solution.solution}</Paragraph>
          <Space wrap>{solution.technologies.slice(0, 3).map((item) => <Tag key={item.name}>{item.name}</Tag>)}</Space>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-3">
          <Button type="link" onClick={onView} className="p-0 font-bold">View Full Solution <ArrowRightOutlined /></Button>
        </div>
      </div>
    </Card>
  );
}

function PageHeading({ icon, title, subtitle, action }: { icon: React.ReactNode; title: string; subtitle: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200 pb-7">
      <div className="flex items-center gap-4">
        <span className="page-heading-icon">{icon}</span>
        <div><Title level={2} className="!m-0 !text-2xl">{title}</Title><Text type="secondary">{subtitle}</Text></div>
      </div>
      {action}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">{label}{required && " *"}</span>{children}</label>;
}

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
