import React from "react";
import { Layout, Menu, Button, Tag, Typography, Space, ConfigProvider } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Smartphone,
  PackagePlus,
  ShoppingCart,
  CreditCard,
  FileText,
  LogOut,
  RotateCcw,
  Store,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { initDatabase } from "../services/storageService";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const ROLE_MENUS = {
  Admin: ["/", "/orders", "/products", "/imports", "/payments", "/invoices"],
  Staff: ["/", "/orders", "/products"],
  Cashier: ["/", "/payments", "/invoices"],
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const allowedPaths = ROLE_MENUS[user?.role] || ["/"];

  const allItems = [
    { key: "/", icon: <LayoutDashboard size={17} />, label: "Tổng quan" },
    { key: "/orders", icon: <ShoppingCart size={17} />, label: "Bán hàng POS" },
    { key: "/products", icon: <Smartphone size={17} />, label: "Sản phẩm & Kho" },
    { key: "/imports", icon: <PackagePlus size={17} />, label: "Nhập hàng" },
    { key: "/payments", icon: <CreditCard size={17} />, label: "Thanh toán" },
    { key: "/invoices", icon: <FileText size={17} />, label: "Hóa đơn" },
  ].filter((item) => allowedPaths.includes(item.key));

  const handleResetDemo = async () => {
    await initDatabase(true);
    window.location.reload();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d97706",
          borderRadius: 12,
          colorBgLayout: "#f6f4f0",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        },
        components: {
          Menu: {
            itemSelectedBg: "#fef3c7",
            itemSelectedColor: "#b45309",
            itemHoverBg: "#faf5eb",
            itemBorderRadius: 10,
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: "#f6f4f0" }}>
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          width={236}
          style={{
            background: "#fffdf9",
            borderRight: "1px solid #ebe6dc",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #f1ece1",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1.2 }}>
                MobileCafe POS
              </div>
              <div style={{ fontSize: 11, color: "#78716c" }}>Quản lý cửa hàng ĐT</div>
            </div>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={allItems}
            onClick={({ key }) => navigate(key)}
            style={{
              background: "transparent",
              borderInlineEnd: "none",
              padding: "12px 10px",
            }}
          />
        </Sider>

        <Layout style={{ background: "#f6f4f0" }}>
          <Header
            style={{
              background: "#fffdf9",
              padding: "0 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #ebe6dc",
            }}
          >
            <Space>
              <Text strong style={{ fontSize: 15, color: "#1e293b" }}>
                Xin chào, {user?.full_name}
              </Text>
              <Tag color="gold" style={{ borderRadius: 8, fontWeight: 600, border: "none" }}>
                {user?.role}
              </Tag>
            </Space>

            <Space>
              <Button icon={<RotateCcw size={14} />} onClick={handleResetDemo} size="small">
                Khôi phục dữ liệu mẫu
              </Button>
              <Button danger icon={<LogOut size={14} />} onClick={logout} size="small">
                Đăng xuất
              </Button>
            </Space>
          </Header>

          <Content style={{ margin: 22 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}