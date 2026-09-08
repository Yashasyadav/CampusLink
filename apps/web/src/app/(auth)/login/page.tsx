"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ConfigProvider, Form, Input, Button, Alert, Typography } from "antd";
import { Sparkles, ShieldCheck, Cpu, RefreshCw } from "lucide-react";
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { fetchApi, ApiError } from "@/lib/api-client";
import Background3DCanvas from "@/components/background-3d";
import Card3DCanvas from "@/components/card-3d-canvas";

const { Title, Text, Paragraph } = Typography;

type CaptchaChallenge = {
  challengeToken: string;
  image?: string;
  display?: string;
};

type CaptchaResponse = {
  success: boolean;
  captcha: CaptchaChallenge;
};

type LoginFailureData = {
  error?: string;
  message?: string;
  nextCaptcha?: CaptchaChallenge;
};

export default function LoginPage() {
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaShake, setCaptchaShake] = useState(false);
  const captchaInputRef = useRef<any>(null);

  const focusCaptcha = () => {
    window.setTimeout(() => captchaInputRef.current?.focus?.(), 40);
  };

  const fetchCaptcha = async (
    endpoint: "/api/v1/auth/captcha" | "/api/v1/auth/captcha/refresh",
    options: RequestInit = {}
  ) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const sameOriginResponse = await fetch(endpoint, {
      credentials: "include",
      ...options,
      headers,
    });
    if (sameOriginResponse.ok) {
      return (await sameOriginResponse.json()) as CaptchaResponse;
    }

    return fetchApi<CaptchaResponse>(endpoint, options);
  };

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const res = await fetchCaptcha("/api/v1/auth/captcha");
      setCaptcha(res.captcha);
      setCaptchaError(false);
      form.setFieldValue("captchaValue", "");
    } catch {
      setError("Could not load CAPTCHA. Please refresh it and try again.");
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const refreshCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const res = await fetchCaptcha("/api/v1/auth/captcha/refresh", {
        method: "POST",
        body: JSON.stringify({ captchaToken: captcha?.challengeToken }),
      });
      setCaptcha(res.captcha);
      setCaptchaError(false);
      form.setFieldValue("captchaValue", "");
      focusCaptcha();
    } catch {
      setError("Could not refresh CAPTCHA. Please try again.");
    } finally {
      setCaptchaLoading(false);
    }
  };

  const applyNextCaptcha = (nextCaptcha?: CaptchaChallenge) => {
    if (nextCaptcha) {
      setCaptcha(nextCaptcha);
    }
    form.setFieldValue("captchaValue", "");
    setCaptchaError(true);
    setCaptchaShake(true);
    window.setTimeout(() => setCaptchaShake(false), 420);
    focusCaptcha();
  };

  const onFinish = async (values: { email?: string; password?: string; captchaValue?: string }) => {
    const { email, password, captchaValue } = values;
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    if (!captcha?.challengeToken || !captchaValue?.trim()) {
      setError("Please enter the CAPTCHA.");
      setCaptchaError(true);
      focusCaptcha();
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(email, password, captcha.challengeToken, captchaValue);
    } catch (err: any) {
      const data = err instanceof ApiError ? (err.data as LoginFailureData) : undefined;
      if (data?.error === "captcha_invalid" || data?.nextCaptcha) {
        applyNextCaptcha(data.nextCaptcha);
      }
      setError(data?.message || err?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 14,
          fontFamily: "inherit",
          colorBgContainer: "#ffffff",
        },
        components: {
          Button: {
            controlHeight: 46,
            fontSize: 14,
            fontWeight: 600,
          },
          Input: {
            controlHeight: 46,
            fontSize: 14,
          },
        },
      }}
    >
      {/* Light Theme Outer Background */}
      <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/80 flex items-center justify-center p-4 md:p-8 overflow-hidden">
        
        {/* Outer 3D Interactive Particle Mesh Canvas */}
        <Background3DCanvas />

        {/* Soft Ambient Light Glow Orbs Behind Card */}
        <div className="absolute top-1/4 left-1/6 w-[450px] h-[450px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/6 w-[450px] h-[450px] bg-indigo-400/20 rounded-full blur-[130px] pointer-events-none animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-orange-300/25 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

        {/* 3D Glassmorphic Container Card (Flat position, no tilt) */}
        <div className="relative z-10 w-full max-w-5xl bg-white/90 backdrop-blur-2xl border border-white/70 rounded-3xl shadow-[0_20px_50px_-10px_rgba(37,99,235,0.18),0_10px_30px_-5px_rgba(0,0,0,0.06)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
          
          {/* Left Branding Panel with 3D Animated AI Core Canvas */}
          <div className="md:col-span-6 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            
            {/* 3D Geometric AI Core Canvas inside Left Panel */}
            <Card3DCanvas />

            {/* Ambient Lighting Overlay */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-400/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:20px_20px]" />

            <div className="relative z-10 space-y-6">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300 overflow-hidden border border-white/40">
                  <img src="/ksrct-logo.png" alt="KSRCT Logo" className="h-11 w-11 object-contain" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  CampusLink <span className="text-orange-400">AI</span>
                </span>
              </Link>

              <div className="space-y-4 pt-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/25 text-blue-100 shadow-sm hover:bg-white/25 transition">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Evidence-Backed Matching
                </span>

                <Title level={2} style={{ color: "#ffffff", margin: 0, fontWeight: 800 }} className="!text-white leading-tight tracking-tight drop-shadow-md">
                  Turn campus knowledge into your next breakthrough.
                </Title>
                
                <Paragraph style={{ color: "#dbeafe", fontSize: "14px", margin: 0 }} className="leading-relaxed max-w-md drop-shadow">
                  Discover the people, active projects, research papers, and hardware resources that can help solve your problem.
                </Paragraph>
              </div>
            </div>

            {/* Bottom Tech Features with Glassmorphism */}
            <div className="relative z-10 pt-8 border-t border-white/20 grid grid-cols-2 gap-4 text-xs text-blue-100">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl border border-white/25 p-3 rounded-2xl shadow-lg hover:bg-white/20 transition">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">Verified Campus Assets</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl border border-white/25 p-3 rounded-2xl shadow-lg hover:bg-white/20 transition">
                <Cpu className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="font-semibold">Agentic Intelligence</span>
              </div>
            </div>
          </div>

          {/* Right Ant Design Form Panel */}
          <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white space-y-6 relative">
            <div className="space-y-1">
              <Title level={3} style={{ margin: 0, fontWeight: 800 }} className="text-slate-900 tracking-tight">
                Welcome back
              </Title>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Sign in to access your CampusLink account.
              </Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                className="rounded-2xl border-rose-200 bg-rose-50/80 text-xs"
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
              className="space-y-3"
            >
              <Form.Item
                label={<Text strong className="text-xs uppercase tracking-wider text-slate-700">Campus Email</Text>}
                name="email"
                rules={[
                  { required: true, message: "Please enter your campus email" },
                  { type: "email", message: "Please enter a valid email address" },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-400 mr-1.5 text-base" />}
                  placeholder="student@campuslink.edu"
                  autoComplete="email"
                  className="rounded-xl border-slate-200 hover:border-blue-500 focus:border-blue-600 transition"
                />
              </Form.Item>

              <Form.Item
                label={<Text strong className="text-xs uppercase tracking-wider text-slate-700">Password</Text>}
                name="password"
                rules={[{ required: true, message: "Please enter your password" }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-1.5 text-base" />}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="rounded-xl border-slate-200 hover:border-blue-500 focus:border-blue-600 transition"
                />
              </Form.Item>

              <Form.Item
                htmlFor="captcha"
                label={
                  <div className="flex items-center justify-between w-full">
                    <Text strong className="text-xs uppercase tracking-wider text-slate-700">CAPTCHA</Text>
                    <button
                      type="button"
                      aria-label="Refresh CAPTCHA"
                      onClick={refreshCaptcha}
                      disabled={captchaLoading}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition"
                    >
                      <RefreshCw className={`h-4 w-4 ${captchaLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                }
              >
                <div className={`space-y-2 ${captchaShake ? "captcha-shake" : ""}`}>
                  <div className="h-[70px] rounded-xl border border-slate-200 bg-blue-50/70 flex items-center justify-center overflow-hidden">
                    {captcha?.image ? (
                      <img src={captcha.image} alt="CAPTCHA challenge" className="h-full w-full object-contain" />
                    ) : (
                      <Text className="font-bold tracking-[0.25em] text-blue-700">
                        {captchaLoading ? "Loading" : captcha?.display || "Unavailable"}
                      </Text>
                    )}
                  </div>
                  <Form.Item
                    name="captchaValue"
                    rules={[{ required: true, message: "Please enter the CAPTCHA" }]}
                    noStyle
                  >
                    <Input
                      ref={captchaInputRef}
                      id="captcha"
                      placeholder="Enter CAPTCHA"
                      autoComplete="off"
                      maxLength={20}
                      onChange={() => {
                        setCaptchaError(false);
                        if (error === "Incorrect CAPTCHA. Please try again.") {
                          setError(null);
                        }
                      }}
                      className={`rounded-xl border-slate-200 hover:border-blue-500 focus:border-blue-600 transition ${
                        captchaError ? "!border-rose-400 !shadow-rose-100" : ""
                      }`}
                    />
                  </Form.Item>
                </div>
              </Form.Item>

              <Form.Item style={{ marginTop: "28px", marginBottom: "8px" }}>
                <Button
                  id="campuslink-signin-btn"
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={!loading && <ArrowRightOutlined />}
                  className="bg-blue-600 hover:!bg-blue-700 h-12 text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95"
                >
                  {loading ? "Signing in..." : "Sign In to CampusLink"}
                </Button>
              </Form.Item>
            </Form>

            <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 transition">
                Create an account
              </Link>
            </div>
          </div>

        </div>
      </main>
    </ConfigProvider>
  );
}
