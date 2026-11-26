import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Tag,
  Space,
  ConfigProvider,
} from "antd";
import {
  Smartphone,
  ShieldCheck,
  User,
  Lock,
  Cpu,
  Headphones,
  BatteryCharging,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState("");

  const onFinish = ({ username, password }) => {
    try {
      setError("");
      login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const fillDemoAccount = (username) => {
    form.setFieldsValue({ username, password: "123" });
    setError("");
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d97706",
          borderRadius: 12,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, #fef3c7 0%, #f6f4f0 48%, #efe9dc 100%)",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 920,
            background: "#fffdf9",
            border: "1.5px solid #e7e0d2",
            borderRadius: 24,
            boxShadow: "0 24px 60px -15px rgba(30, 41, 59, 0.12)",
            overflow: "hidden",
          }}
        >
          <Row>
            {/* Cột trái: Minh họa điện thoại & hệ sinh thái cửa hàng ĐT */}
            <Col
              xs={24}
              md={11}
              style={{
                background: "linear-gradient(155deg, #1e293b 0%, #0f172a 100%)",
                padding: "32px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                position: "relative",
              }}
            >
              {/* Khung Smartphone mô phỏng */}
              <div
                style={{
                  width: 210,
                  borderRadius: 32,
                  padding: 10,
                  background: "linear-gradient(145deg, #d97706, #78350f)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#fffdf9",
                    color: "#1e293b",
                    borderRadius: 24,
                    padding: "14px 14px 16px",
                    position: "relative",
                  }}
                >
                  {/* Dynamic Island */}
                  <div
                    style={{
                      width: 68,
                      height: 16,
                      background: "#0f172a",
                      borderRadius: 999,
                      margin: "0 auto 12px",
                    }}
                  />

                  <div
                    style={{
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      borderRadius: 14,
                      padding: 12,
                      textAlign: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Smartphone size={28} color="#b45309" />
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        color: "#78350f",
                        marginTop: 4,
                      }}
                    >
                      iPhone • Samsung • Xiaomi
                    </div>
                    <div style={{ fontSize: 10, color: "#92400e" }}>
                      OPPO • vivo • Phụ kiện
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "8px 6px",
                        textAlign: "center",
                      }}
                    >
                      <Headphones size={15} color="#d97706" />
                      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                        Tai nghe
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "8px 6px",
                        textAlign: "center",
                      }}
                    >
                      <BatteryCharging size={15} color="#0d9488" />
                      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                        Sạc & Ốp
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  Quản lý Cửa hàng Điện thoại
                </div>
                <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                  Kho máy • Bán hàng POS • Thu ngân & Hóa đơn
                </div>
              </div>
            </Col>

            {/* Cột phải: Form đăng nhập */}
            <Col xs={24} md={13} style={{ padding: "36px 34px" }}>
              <div style={{ marginBottom: 20 }}>
                <Tag
                  color="gold"
                  icon={<Cpu size={13} />}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    marginBottom: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  POS System
                </Tag>
                <Title level={3} style={{ margin: 0, color: "#1e293b" }}>
                  Đăng nhập hệ thống
                </Title>
                
              </div>

              {/* Nút điền nhanh 3 phân quyền */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: "#78716c", marginBottom: 6 }}>
                  Điền nhanh tài khoản demo (MK: 123):
                </div>
                <Space wrap>
                  <Button size="small" onClick={() => fillDemoAccount("admin")}>
                    Admin
                  </Button>
                  <Button size="small" onClick={() => fillDemoAccount("staff1")}>
                    Staff (Bán hàng)
                  </Button>
                  <Button size="small" onClick={() => fillDemoAccount("cashier1")}>
                    Cashier (Thu ngân)
                  </Button>
                </Space>
              </div>

              {error && (
                <Alert
                  type="error"
                  showIcon
                  message={error}
                  style={{ marginBottom: 16, borderRadius: 10 }}
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ username: "admin", password: "123" }}
              >
                <Form.Item
                  label="Tên đăng nhập"
                  name="username"
                  rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
                >
                  <Input
                    size="large"
                    prefix={<User size={16} color="#94a3b8" />}
                    placeholder="Nhập tên đăng nhập..."
                  />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                >
                  <Input.Password
                    size="large"
                    prefix={<Lock size={16} color="#94a3b8" />}
                    placeholder="Nhập mật khẩu..."
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  icon={<ShieldCheck size={18} />}
                  style={{
                    height: 44,
                    fontWeight: 700,
                    marginTop: 6,
                    boxShadow: "0 8px 18px -4px rgba(217, 119, 6, 0.45)",
                  }}
                >
                  Đăng nhập hệ thống
                </Button>
              </Form>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
}