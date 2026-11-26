import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Space,
  InputNumber,
  Empty,
  message,
} from "antd";
import {
  Banknote,
  Landmark,
  CreditCard,
  CheckCircle2,
  Receipt,
  UserCheck,
} from "lucide-react";
import {
  getDB,
  formatVND,
  payOrderService,
} from "../../services/storageService";

const PAYMENT_METHODS = [
  {
    value: "CASH",
    label: "Tiền mặt",
    icon: <Banknote size={17} color="#15803d" />,
  },
  {
    value: "BANK_TRANSFER",
    label: "Chuyển khoản",
    icon: <Landmark size={17} color="#1d4ed8" />,
  },
  {
    value: "CARD",
    label: "Quẹt thẻ POS",
    icon: <CreditCard size={17} color="#b45309" />,
  },
];

export default function PaymentsPage() {
  const [, setTick] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [method, setMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState(0);

  const db = getDB() || { orders: [], customers: [], invoices: [] };
  const refresh = () => setTick((t) => t + 1);

  const pendingOrders = (db.orders || []).filter((o) => o.status === "PENDING");
  const customerMap = Object.fromEntries(
    (db.customers || []).map((c) => [c.customer_id, c])
  );

  useEffect(() => {
    if (pendingOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    const stillExists = pendingOrders.some(
      (o) => o.order_id === selectedOrderId
    );
    if (!stillExists) {
      setSelectedOrderId(pendingOrders[0].order_id);
    }
  }, [pendingOrders.length, selectedOrderId]);

  const activeOrder =
    pendingOrders.find((o) => o.order_id === selectedOrderId) || null;

  useEffect(() => {
    if (activeOrder) {
      setCashReceived(Number(activeOrder.total_amount || 0));
    } else {
      setCashReceived(0);
    }
  }, [activeOrder?.order_id, activeOrder?.total_amount]);

  const handlePay = () => {
    if (!activeOrder) return;
    try {
      const { invoice } = payOrderService(activeOrder.order_id, method);
      message.success(
        `Đã thanh toán đơn ${activeOrder.order_id} • Xuất hóa đơn ${invoice.invoice_id}`
      );
      refresh();
    } catch (err) {
      message.error(err.message);
    }
  };

  const paidTodayCount = (db.invoices || []).filter(
    (i) => i.status === "PAID"
  ).length;
  const pendingTotal = pendingOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );
  const changeAmount =
    method === "CASH" && activeOrder
      ? Math.max(0, Number(cashReceived || 0) - Number(activeOrder.total_amount || 0))
      : 0;

  return (
    <div>
      {/* 3 thẻ tóm tắt quầy thu ngân */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div className="retail-summary-label">Đơn chờ thanh toán</div>
            <div className="retail-summary-value" style={{ color: "#d97706" }}>
              {pendingOrders.length} đơn
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Chọn đơn bên trái để thu tiền tại quầy
            </div>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div className="retail-summary-label">Giá trị chờ thu</div>
            <div className="retail-summary-value" style={{ color: "#0f172a" }}>
              {formatVND(pendingTotal)}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Tổng các đơn đang ở trạng thái PENDING
            </div>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div className="retail-summary-label">Hóa đơn đã hoàn tất</div>
            <div className="retail-summary-value" style={{ color: "#15803d" }}>
              {paidTodayCount} hóa đơn
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Tự động lưu vào lịch sử Hóa đơn
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[18, 18]} align="top">
        {/* Cột trái: Danh sách đơn chờ thanh toán */}
        <Col xs={24} lg={13}>
          <Card
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                }}
              >
                <Receipt size={18} color="#d97706" />
                <span>Danh sách đơn hàng chờ thanh toán</span>
              </span>
            }
            className="cafe-shell-card"
          >
            {pendingOrders.length === 0 ? (
              <Empty description="Hiện không có đơn hàng nào đang chờ thanh toán" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pendingOrders.map((ord) => {
                  const cust = customerMap[ord.customer_id];
                  const isSelected = ord.order_id === activeOrder?.order_id;
                  const totalItems = (ord.items || []).reduce(
                    (s, it) => s + Number(it.quantity || 0),
                    0
                  );

                  return (
                    <div
                      key={ord.order_id}
                      className={`pending-order-tile ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => setSelectedOrderId(ord.order_id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <Space size={8} style={{ marginBottom: 6 }}>
                            <Tag color="gold" style={{ fontWeight: 700 }}>
                              {ord.order_id}
                            </Tag>
                            <Tag color="processing">PENDING</Tag>
                            <span style={{ fontSize: 12, color: "#78716c" }}>
                              {ord.order_date}
                            </span>
                          </Space>

                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: "#0f172a",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <UserCheck size={15} color="#b45309" />
                            <span>
                              {cust?.full_name || ord.customer_id}
                            </span>
                            {cust?.phone && (
                              <span
                                style={{
                                  fontWeight: 400,
                                  fontSize: 12.5,
                                  color: "#78716c",
                                }}
                              >
                                • {cust.phone}
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 12.5,
                              color: "#57534e",
                              marginTop: 4,
                            }}
                          >
                            {(ord.items || [])
                              .map((it) => `${it.product_name} (x${it.quantity})`)
                              .join(", ")}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 17,
                              color: "#b45309",
                            }}
                          >
                            {formatVND(ord.total_amount)}
                          </div>
                          <div style={{ fontSize: 12, color: "#78716c" }}>
                            {totalItems} sản phẩm
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Cột phải: Quầy thu tiền */}
        <Col xs={24} lg={11}>
          <Card
            title="Quầy thu tiền & Xuất hóa đơn"
            className="cafe-shell-card"
          >
            {!activeOrder ? (
              <Empty description="Chọn một đơn hàng để thu tiền" />
            ) : (
              <div>
                <div className="receipt-preview-box" style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#78716c", fontSize: 13 }}>
                      Mã đơn hàng
                    </span>
                    <strong>{activeOrder.order_id}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ color: "#78716c", fontSize: 13 }}>
                      Khách hàng
                    </span>
                    <strong>
                      {customerMap[activeOrder.customer_id]?.full_name ||
                        activeOrder.customer_id}
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed #e5dec9",
                      paddingTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {(activeOrder.items || []).map((it, idx) => (
                      <div
                        key={`${it.product_id}-${idx}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#1e293b" }}>
                          {it.product_name} <strong>x{it.quantity}</strong>
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {formatVND(it.unit_price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#44403c",
                      marginBottom: 8,
                    }}
                  >
                    Phương thức thanh toán
                  </div>
                  <Row gutter={[8, 8]}>
                    {PAYMENT_METHODS.map((pm) => (
                      <Col span={8} key={pm.value}>
                        <Button
                          block
                          className={`payment-method-btn ${
                            method === pm.value ? "active-method" : ""
                          }`}
                          onClick={() => setMethod(pm.value)}
                        >
                          {pm.icon}
                          <span style={{ fontSize: 12.5 }}>{pm.label}</span>
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>

                {method === "CASH" && (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#44403c" }}>
                        Tiền khách đưa
                      </span>
                      <span style={{ color: "#15803d", fontWeight: 700 }}>
                        Tiền thừa: {formatVND(changeAmount)}
                      </span>
                    </div>
                    <InputNumber
                      size="large"
                      min={0}
                      step={50000}
                      value={cashReceived}
                      onChange={(val) => setCashReceived(Number(val || 0))}
                      style={{ width: "100%" }}
                      formatter={(v) =>
                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                      }
                      parser={(v) => (v ? v.replace(/\./g, "") : 0)}
                    />
                  </div>
                )}

                <div
                  style={{
                    background: "#fffbeb",
                    border: "1.5px solid #fcd34d",
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#78350f" }}>
                    Cần thanh toán
                  </span>
                  <span
                    style={{ fontWeight: 800, fontSize: 20, color: "#b45309" }}
                  >
                    {formatVND(activeOrder.total_amount)}
                  </span>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CheckCircle2 size={18} />}
                  className="btn-add-primary"
                  onClick={handlePay}
                  style={{ height: 46, fontSize: 15 }}
                >
                  Xác nhận thanh toán & Xuất HĐ
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}