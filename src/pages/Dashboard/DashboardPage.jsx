import React from "react";
import { Row, Col, Card, Table, Tag, Progress } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  FileCheck2,
  Flame,
  Clock,
} from "lucide-react";
import { getDB, formatVND } from "../../services/storageService";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const db = getDB() || {
    products: [],
    categories: [],
    orders: [],
    invoices: [],
  };

  const paidInvoices = (db.invoices || []).filter((i) => i.status === "PAID");
  const totalRevenue = paidInvoices.reduce(
    (sum, i) => sum + Number(i.total_amount || 0),
    0
  );
  const totalStock = (db.products || []).reduce(
    (sum, p) => sum + Number(p.quantity || 0),
    0
  );
  const lowStockProducts = (db.products || []).filter((p) => p.quantity <= 5);

  // Gộp doanh thu theo ngày (tránh trùng ngày có nhiều hóa đơn)
  const revenueByDateMap = {};
  paidInvoices.forEach((inv) => {
    const d = inv.invoice_date;
    revenueByDateMap[d] = (revenueByDateMap[d] || 0) + Number(inv.total_amount || 0);
  });
  const chartData = Object.entries(revenueByDateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  // Tính sản phẩm bán chạy từ các đơn hàng hợp lệ (PAID hoặc PENDING)
  const soldQtyMap = {};
  (db.orders || [])
    .filter((o) => o.status !== "CANCELLED")
    .forEach((o) => {
      (o.items || []).forEach((item) => {
        soldQtyMap[item.product_id] =
          (soldQtyMap[item.product_id] || 0) + Number(item.quantity || 0);
      });
    });

  const bestSellers = Object.entries(soldQtyMap)
    .map(([product_id, sold]) => {
      const prod = (db.products || []).find((p) => p.product_id === product_id);
      return {
        product_id,
        product_name: prod?.product_name || product_id,
        selling_price: prod?.selling_price || 0,
        sold,
      };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Tính doanh thu theo danh mục từ hóa đơn đã thanh toán
  const paidOrderIds = new Set(paidInvoices.map((i) => i.order_id));
  const categoryRevenueMap = {};
  (db.orders || [])
    .filter((o) => paidOrderIds.has(o.order_id))
    .forEach((o) => {
      (o.items || []).forEach((it) => {
        const prod = (db.products || []).find((p) => p.product_id === it.product_id);
        const catName =
          (db.categories || []).find((c) => c.category_id === prod?.category_id)
            ?.category_name || "Khác";
        categoryRevenueMap[catName] =
          (categoryRevenueMap[catName] || 0) +
          Number(it.unit_price || 0) * Number(it.quantity || 0);
      });
    });

  const categoryStats = Object.entries(categoryRevenueMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const kpiCards = [
    {
      key: "revenue",
      title: "Tổng doanh thu",
      value: formatVND(totalRevenue),
      sub: `${paidInvoices.length} giao dịch đã thu`,
      icon: <TrendingUp size={20} color="#b45309" />,
      iconBg: "#fef3c7",
      valueColor: "#b45309",
    },
    {
      key: "orders",
      title: "Tổng đơn hàng",
      value: (db.orders || []).length,
      sub: `${(db.orders || []).filter((o) => o.status === "PENDING").length} đơn chờ thanh toán`,
      icon: <ShoppingBag size={20} color="#c2410c" />,
      iconBg: "#ffedd5",
      valueColor: "#1e293b",
    },
    {
      key: "stock",
      title: "Tổng tồn kho",
      value: totalStock,
      sub: `${(db.products || []).length} mặt hàng • ${lowStockProducts.length} sắp hết`,
      icon: <Boxes size={20} color="#0f766e" />,
      iconBg: "#ccfbf1",
      valueColor: "#1e293b",
    },
    {
      key: "invoices",
      title: "Hóa đơn đã xuất",
      value: paidInvoices.length,
      sub: `Chế độ xem: ${user?.role || "User"}`,
      icon: <FileCheck2 size={20} color="#1d4ed8" />,
      iconBg: "#dbeafe",
      valueColor: "#1e293b",
    },
  ];

  return (
    <div>
      {/* Hàng 1: 4 thẻ KPI */}
      <Row gutter={[16, 16]}>
        {kpiCards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.key}>
            <Card className="kpi-cafe-card" bordered={false}>
              <div className="kpi-top-row">
                <span className="kpi-label">{item.title}</span>
                <div className="kpi-icon-box" style={{ background: item.iconBg }}>
                  {item.icon}
                </div>
              </div>
              <div className="kpi-value" style={{ color: item.valueColor }}>
                {item.value}
              </div>
              <div className="kpi-sub">{item.sub}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Hàng 2: Biểu đồ doanh thu + Sản phẩm bán chạy */}
      <Row gutter={[16, 16]} style={{ marginTop: 18 }}>
        <Col xs={24} lg={14}>
          <Card title="Biểu đồ doanh thu theo ngày" className="cafe-shell-card">
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebe6dc" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#57534e" }} />
                  <YAxis
                    width={64}
                    tick={{ fontSize: 12, fill: "#57534e" }}
                    tickFormatter={(v) =>
                      v === 0 ? "0" : `${Math.round(v / 1000000)}tr`
                    }
                  />
                  <Tooltip formatter={(val) => formatVND(val)} />
                  <Bar
                    dataKey="revenue"
                    name="Doanh thu"
                    fill="#d97706"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Flame size={17} color="#ea580c" />
                <span>Sản phẩm bán chạy</span>
              </span>
            }
            className="cafe-shell-card"
          >
            <Table
              size="small"
              rowKey="product_id"
              pagination={false}
              dataSource={bestSellers}
              columns={[
                {
                  title: "Sản phẩm",
                  dataIndex: "product_name",
                  ellipsis: true,
                },
                {
                  title: "Đã bán",
                  dataIndex: "sold",
                  width: 80,
                  render: (q) => <Tag color="orange">x{q}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Hàng 3: Tỷ trọng doanh thu theo danh mục + Cảnh báo sắp hết hàng + Đơn gần đây */}
      <Row gutter={[16, 16]} style={{ marginTop: 18 }}>
        <Col xs={24} lg={8}>
          <Card title="Doanh thu theo danh mục" className="cafe-shell-card">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {categoryStats.map((c) => (
                <div key={c.category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <strong style={{ color: "#1e293b" }}>{c.category}</strong>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>
                      {formatVND(c.amount)} ({c.percent}%)
                    </span>
                  </div>
                  <Progress
                    percent={c.percent}
                    showInfo={false}
                    strokeColor="#d97706"
                    trailColor="#f1ece1"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Sản phẩm sắp hết hàng (tồn <= 5)" className="cafe-shell-card">
            <Table
              size="small"
              rowKey="product_id"
              pagination={{ pageSize: 4 }}
              dataSource={lowStockProducts}
              columns={[
                { title: "Sản phẩm", dataIndex: "product_name", ellipsis: true },
                {
                  title: "Tồn",
                  dataIndex: "quantity",
                  width: 65,
                  render: (q) => <Tag color="volcano">{q}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Clock size={16} color="#b45309" />
                <span>Đơn hàng gần đây</span>
              </span>
            }
            className="cafe-shell-card"
          >
            <Table
              size="small"
              rowKey="order_id"
              pagination={{ pageSize: 4 }}
              dataSource={(db.orders || []).slice(0, 6)}
              columns={[
                { title: "Mã", dataIndex: "order_id", width: 65 },
                {
                  title: "Tổng tiền",
                  dataIndex: "total_amount",
                  render: (v) => <strong>{formatVND(v)}</strong>,
                },
                {
                  title: "TT",
                  dataIndex: "status",
                  width: 92,
                  render: (st) => {
                    const color =
                      st === "PAID" ? "green" : st === "CANCELLED" ? "red" : "gold";
                    return <Tag color={color}>{st}</Tag>;
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}