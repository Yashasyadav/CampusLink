"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Form, Input, Radio, Typography } from "antd";
import { Award, GraduationCap, Sparkles, UserCheck } from "lucide-react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";

const { Paragraph, Text, Title } = Typography;

const ROLES = [
  { id: "STUDENT", title: "Student", icon: GraduationCap },
  { id: "FACULTY", title: "Faculty", icon: UserCheck },
  { id: "ALUMNI", title: "Alumni", icon: Award },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setError(null);
      setLoading(true);
      await register(values.email, values.password, role);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-5xl overflow-hidden shadow-2xl" styles={{ body: { padding: 0 } }}>
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
          <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-8 md:p-12 text-white flex flex-col justify-between">
            <div className="space-y-10">
              <Link href="/" className="inline-flex items-center gap-3 text-white">
                <span className="w-11 h-11 bg-white rounded-full flex items-center justify-center overflow-hidden border border-white/40">
                  <img src="/ksrct-logo.png" alt="KSRCT Logo" className="h-10 w-10 object-contain" />
                </span>
                <span className="font-extrabold text-xl tracking-tight">
                  CampusLink <span className="text-orange-400">AI</span>
                </span>
              </Link>
              <div className="space-y-3">
                <Text className="!text-blue-100 uppercase tracking-wider !text-xs !font-bold">
                  Join the Campus Expertise Network
                </Text>
                <Title level={2} className="!text-white !m-0">Create your CampusLink account.</Title>
                <Paragraph className="!text-blue-100 !text-sm">
                  Connect with verified projects, research papers, hardware laboratories, and problem/solution records.
                </Paragraph>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white">
            <Title level={2} className="!mb-1">Create an Account</Title>
            <Text type="secondary">Select your role and enter your credentials.</Text>

            {error && <Alert className="mt-6" type="error" showIcon message={error} />}

            <Form layout="vertical" requiredMark={false} onFinish={handleSubmit} className="mt-6">
              <Form.Item label="Select Your Campus Role">
                <Radio.Group value={role} onChange={(e) => setRole(e.target.value)} className="w-full">
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(({ id, title, icon: Icon }) => (
                      <Radio.Button key={id} value={id} className="!h-auto !p-0 !rounded-xl !overflow-hidden text-center">
                        <span className="flex flex-col items-center gap-1.5 p-3">
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-semibold">{title}</span>
                        </span>
                      </Radio.Button>
                    ))}
                  </div>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Campus Email Address" name="email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="student@campuslink.edu" />
              </Form.Item>

              <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password" }]}>
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Password123!" />
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                Create CampusLink Account
              </Button>
            </Form>

            <div className="pt-6 mt-6 text-center text-xs text-slate-500 border-t border-slate-100">
              Already have an account? <Link href="/login" className="font-bold text-blue-600">Sign in</Link>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
