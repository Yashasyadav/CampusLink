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
  List,
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
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  MailOutlined,
  PlusOutlined,
  SearchOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ErrorState } from "@/components/ui/error-state";
import { CardGridSkeleton, FacilityCardSkeleton } from "@/components/ui/skeletons";
import { ApiError } from "@/lib/api-client";
import { knowledgeService } from "@/services/knowledge";
import { Facility } from "@/types";

const { Paragraph, Text, Title } = Typography;

type FacilityStatusFilter = "ALL" | Facility["status"];

type FacilityFormValues = {
  name: string;
  facility_type: string;
  location: string;
  building?: string;
  floor?: string;
  department?: string;
  contact_email?: string;
  operating_hours?: string;
  description?: string;
  capabilities?: string;
  status: Facility["status"];
  visibility: Facility["visibility"];
};

const defaultFacilityValues: FacilityFormValues = {
  name: "",
  facility_type: "LABORATORY",
  location: "",
  building: "",
  floor: "",
  department: "",
  contact_email: "",
  operating_hours: "",
  description: "",
  capabilities: "",
  status: "OPERATIONAL",
  visibility: "PUBLIC",
};

const statusOptions: { label: string; value: FacilityStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Operational", value: "OPERATIONAL" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Restricted", value: "RESTRICTED" },
];

export default function FacilitiesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <FacilitiesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function FacilitiesContent() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FacilityFormValues>();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FacilityStatusFilter>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeService.getFacilities({ facility_type: typeFilter || undefined });
      setFacilities(data.items);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load campus facilities.";
      setError(msg);
      setErrorStatus(err instanceof ApiError ? err.status : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [typeFilter]);

  const facilityTypes = useMemo(() => {
    const values = facilities.map((facility) => facility.facility_type).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [facilities]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return facilities.filter((facility) => {
      const matchesStatus = statusFilter === "ALL" || facility.status === statusFilter;
      const matchesSearch =
        !needle ||
        [
          facility.name,
          facility.department,
          facility.location,
          facility.building,
          facility.description,
          facility.capabilities,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [facilities, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: facilities.length,
      operational: facilities.filter((facility) => facility.status === "OPERATIONAL").length,
      maintenance: facilities.filter((facility) => facility.status === "MAINTENANCE").length,
      equipment: facilities.reduce((sum, facility) => sum + facility.equipment_count, 0),
    }),
    [facilities],
  );

  const handleCreate = async (values: FacilityFormValues) => {
    try {
      setCreating(true);
      await knowledgeService.createFacility({
        name: values.name,
        facility_type: values.facility_type,
        location: values.location,
        building: values.building || undefined,
        floor: values.floor || undefined,
        department: values.department || undefined,
        contact_email: values.contact_email || undefined,
        operating_hours: values.operating_hours || undefined,
        description: values.description || undefined,
        capabilities: values.capabilities || undefined,
        status: values.status,
        visibility: values.visibility,
      });
      setIsModalOpen(false);
      form.resetFields();
      message.success("Facility added");
      fetchFacilities();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Failed to create facility.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-page px-6 py-8 md:px-10">
      <div className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="page-heading-icon facility-heading-icon">
            <BankOutlined />
          </span>
          <div>
            <Title level={2} className="!m-0 !text-2xl">
              Facilities & Equipment
            </Title>
            <Text type="secondary">
              {loading ? "Loading..." : `${facilities.length} facilit${facilities.length !== 1 ? "ies" : "y"} on campus`}
            </Text>
          </div>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Facility
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Facilities" value={stats.total} prefix={<BankOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Operational" value={stats.operational} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#16a34a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Maintenance" value={stats.maintenance} prefix={<WarningOutlined />} valueStyle={{ color: "#f59e0b" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Equipment" value={stats.equipment} prefix={<ToolOutlined />} valueStyle={{ color: "#2563eb" }} />
          </Card>
        </Col>
      </Row>

      <div className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px_auto]">
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search labs by name, department, location, capability, or equipment..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select
          size="large"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "", label: "All Facility Types" },
            ...facilityTypes.map((type) => ({ value: type, label: type.replace(/_/g, " ") })),
            { value: "LABORATORY", label: "Laboratory" },
            { value: "MAKERSPACE", label: "Makerspace" },
            { value: "STUDIO", label: "Studio" },
            { value: "COMPUTING_CENTER", label: "Computing Center" },
            { value: "LIBRARY", label: "Library" },
            { value: "OTHER", label: "Other" },
          ]}
        />
        <Segmented
          size="large"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as FacilityStatusFilter)}
          options={statusOptions}
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={6} Skeleton={FacilityCardSkeleton} />
      ) : error ? (
        <ErrorState status={errorStatus} message={error} onRetry={fetchFacilities} />
      ) : filtered.length === 0 ? (
        <Card>
          <Empty description={searchQuery ? `No facilities matching "${searchQuery}"` : "No campus facilities found"}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add Facility
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {filtered.map((facility) => (
            <Col key={facility.id} xs={24} md={12} xl={8}>
              <FacilityCard facility={facility} onView={() => setSelectedFacility(facility)} />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title="Add Campus Facility"
        footer={null}
        width={780}
        destroyOnClose
      >
        <Form<FacilityFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={defaultFacilityValues}
          onFinish={handleCreate}
          className="pt-2"
        >
          <Form.Item name="name" label="Facility Name" rules={[{ required: true, message: "Enter facility name" }]}>
            <Input placeholder="Electronics & IoT Lab" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="facility_type" label="Facility Type">
                <Select options={[
                  { value: "LABORATORY", label: "Laboratory" },
                  { value: "MAKERSPACE", label: "Makerspace" },
                  { value: "STUDIO", label: "Studio" },
                  { value: "COMPUTING_CENTER", label: "Computing Center" },
                  { value: "LIBRARY", label: "Library" },
                  { value: "OTHER", label: "Other" },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Status">
                <Select options={[
                  { value: "OPERATIONAL", label: "Operational" },
                  { value: "MAINTENANCE", label: "Under Maintenance" },
                  { value: "RESTRICTED", label: "Restricted" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="location" label="Location" rules={[{ required: true, message: "Enter facility location" }]}>
            <Input prefix={<EnvironmentOutlined />} placeholder="Block A, Room 301" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="building" label="Building">
                <Input placeholder="Engineering Block" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="floor" label="Floor">
                <Input placeholder="3" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="department" label="Department">
                <Input placeholder="ECE, CSE" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What can students use this facility for?" />
          </Form.Item>

          <Form.Item name="capabilities" label="Capabilities">
            <Input.TextArea rows={2} placeholder="PCB testing, embedded prototyping, GPU training, signal analysis..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="contact_email" label="Contact Email">
                <Input type="email" prefix={<MailOutlined />} placeholder="lab@university.edu" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="operating_hours" label="Operating Hours">
                <Input prefix={<ClockCircleOutlined />} placeholder="Mon-Fri 9 AM - 6 PM" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="visibility" label="Visibility">
            <Select options={[
              { value: "PUBLIC", label: "Public" },
              { value: "CAMPUS_ONLY", label: "Campus Only" },
              { value: "PRIVATE", label: "Private" },
            ]} />
          </Form.Item>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button htmlType="submit" type="primary" loading={creating}>
              Add Facility
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={!!selectedFacility}
        onCancel={() => setSelectedFacility(null)}
        title={selectedFacility?.name}
        footer={null}
        width={820}
      >
        {selectedFacility && <FacilityDetails facility={selectedFacility} />}
      </Modal>
    </div>
  );
}

function FacilityCard({ facility, onView }: { facility: Facility; onView: () => void }) {
  const availableCount = facility.equipment.filter((item) => item.availability_status === "AVAILABLE").length;

  return (
    <Card hoverable className="h-full facility-card" styles={{ body: { height: "100%", padding: 28 } }}>
      <div className="facility-card-body">
        <div className="flex items-start justify-between gap-3">
          <span className="facility-card-icon">
            <ExperimentOutlined />
          </span>
          <Tag color={statusColor(facility.status)} icon={statusIcon(facility.status)}>
            {facility.status.replace(/_/g, " ")}
          </Tag>
        </div>

        <div className="facility-card-main">
          <Space wrap size={[8, 8]} className="mb-3">
            <Tag color="blue">{facility.facility_type.replace(/_/g, " ")}</Tag>
            {facility.department && <Tag>{facility.department}</Tag>}
          </Space>
          <Title level={5} className="!mb-2">
            {facility.name}
          </Title>
          <Paragraph type="secondary" ellipsis={{ rows: 3 }} className="!mb-0">
            {facility.description || facility.capabilities || "No facility description provided."}
          </Paragraph>
        </div>

        <div className="facility-card-meta">
          <Text type="secondary" className="facility-card-line">
            <EnvironmentOutlined /> {facility.location}{facility.building ? `, ${facility.building}` : ""}
          </Text>
          <Text type="secondary" className="facility-card-line">
            <ClockCircleOutlined /> {facility.operating_hours || "Hours not set"}
          </Text>
          <Text className="facility-card-line">
            <MailOutlined /> {facility.contact_email ? <a href={`mailto:${facility.contact_email}`}>{facility.contact_email}</a> : <span className="text-slate-400">Contact not set</span>}
          </Text>
        </div>

        <div className="facility-card-equipment">
          <div>
            <Text strong>{facility.equipment_count}</Text>
            <Text type="secondary"> equipment</Text>
          </div>
          <Tag color={availableCount > 0 ? "green" : "default"}>{availableCount} available</Tag>
        </div>

        <div className="facility-card-footer">
          <Text type="secondary">
            <ToolOutlined /> {facility.equipment.length}
          </Text>
          <Button type="link" onClick={onView} className="p-0 font-bold">
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FacilityDetails({ facility }: { facility: Facility }) {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space wrap>
        <Tag color="blue">{facility.facility_type.replace(/_/g, " ")}</Tag>
        <Tag color={statusColor(facility.status)} icon={statusIcon(facility.status)}>{facility.status.replace(/_/g, " ")}</Tag>
        <Tag>{facility.visibility.replace(/_/g, " ")}</Tag>
        {facility.department && <Tag>{facility.department}</Tag>}
      </Space>

      <Paragraph className="!mb-0">
        {facility.description || "No facility description provided."}
      </Paragraph>

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Location">{facility.location}</Descriptions.Item>
        {facility.building && <Descriptions.Item label="Building">{facility.building}</Descriptions.Item>}
        {facility.floor && <Descriptions.Item label="Floor">{facility.floor}</Descriptions.Item>}
        {facility.operating_hours && <Descriptions.Item label="Operating Hours">{facility.operating_hours}</Descriptions.Item>}
        {facility.contact_email && <Descriptions.Item label="Contact"><a href={`mailto:${facility.contact_email}`}>{facility.contact_email}</a></Descriptions.Item>}
        {facility.capabilities && <Descriptions.Item label="Capabilities">{facility.capabilities}</Descriptions.Item>}
        {facility.availability_notes && <Descriptions.Item label="Availability Notes">{facility.availability_notes}</Descriptions.Item>}
        {facility.responsible_user_name && <Descriptions.Item label="Responsible Person">{facility.responsible_user_name}</Descriptions.Item>}
      </Descriptions>

      <div>
        <Text strong>Equipment</Text>
        {facility.equipment.length === 0 ? (
          <div className="mt-3"><Text type="secondary">No equipment listed.</Text></div>
        ) : (
          <List
            className="mt-3"
            dataSource={facility.equipment}
            renderItem={(item) => (
              <List.Item className="rounded-xl border border-slate-200 bg-slate-50 px-3 !py-3 mb-2">
                <List.Item.Meta
                  avatar={<Avatar icon={<ToolOutlined />} />}
                  title={item.name}
                  description={item.category || "Equipment"}
                />
                <Space wrap>
                  <Tag>Qty {item.quantity}</Tag>
                  <Tag color={item.availability_status === "AVAILABLE" ? "green" : "gold"}>{item.availability_status.replace(/_/g, " ")}</Tag>
                  <Tag>{item.status.replace(/_/g, " ")}</Tag>
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>
    </Space>
  );
}

function statusColor(status: Facility["status"]) {
  if (status === "OPERATIONAL") return "green";
  if (status === "MAINTENANCE") return "gold";
  return "red";
}

function statusIcon(status: Facility["status"]) {
  if (status === "OPERATIONAL") return <CheckCircleOutlined />;
  return <WarningOutlined />;
}
