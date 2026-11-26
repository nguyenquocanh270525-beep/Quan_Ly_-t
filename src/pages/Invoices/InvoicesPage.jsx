import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Modal,
  Descriptions,
} from "antd";
import {
  FileSpreadsheet,
  Search,
  Eye,
  Printer,
  BadgeDollarSign,
} from "lucide-react";
import { getDB, formatVND } from "../../services/storageService";

const METHOD_LABEL = {
  CASH: { text: "Tiền mặt", color: "green" },
  BANK_TRANSFER: { text: "Chuyển khoản", color: "blue" },
  CARD: { text: "Quẹt thẻ POS", color: "gold" },
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const db = getDB() || { invoices: [], orders: [], customers: [] };
  const invoices = db.invoices || [];
  const orders = db.orders || [];
  const customers = db.customers || [];

  const orderMap = Object.fromEntries(orders.map((o) => [o.order_id, o]));
  const customerMap = Object.fromEntries(
    customers.map((c) => [c.customer_id, c])
  );

  const enrichedInvoices = invoices.map((inv) => {
    const ord = orderMap[inv.order_id] || null;
    const cust = ord ? customerMap[ord.customer_id] : null;
    return {
      ...inv,
      order: ord,
      customerName: cust?.full_name || ord?.customer_id || "Khách lẻ",
      customerPhone: cust?.phone || "",
    };
  });

  const filteredInvoices = enrichedInvoices.filter((inv) => {
    const matchMethod =
      methodFilter === "ALL" || inv.payment_method === methodFilter;
    const q = search.trim().toLowerCase();
    const matchText =
      !q ||
      (inv.invoice_id || "").toLowerCase().includes(q) ||
      (inv.order_id || "").toLowerCase().includes(q) ||
      (inv.customerName || "").toLowerCase().includes(q);
    return matchMethod && matchText;
  });

  const totalPaidAmount = enrichedInvoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const cashTotal = enrichedInvoices
    .filter((i) => i.payment_method === "CASH")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const transferTotal = enrichedInvoices
    .filter((i) => i.payment_method === "BANK_TRANSFER")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  return (
    <div>
      {/* 3 thẻ tổng kết hóa đơn */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="retail-summary-label">Tổng doanh thu hóa đơn</span>
              <BadgeDollarSign size={19} color="#b45309" />
            </div>
            <div
              className="retail-summary-value"
              style={{ color: "#b45309" }}
            >
              {formatVND(totalPaidAmount)}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              {enrichedInvoices.length} hóa đơn đã phát hành
            </div>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div className="retail-summary-label">Thu tiền mặt</div>
            <div className="retail-summary-value" style={{ color: "#15803d" }}>
              {formatVND(cashTotal)}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Thanh toán trực tiếp tại quầy
            </div>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div className="retail-summary-label">Chuyển khoản ngân hàng</div>
            <div className="retail-summary-value" style={{ color: "#1d4ed8" }}>
              {formatVND(transferTotal)}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Thanh toán qua QR / chuyển khoản
            </div>
          </div>
        </Col>
      </Row>

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
            <FileSpreadsheet size={18} color="#d97706" />
            <span>Danh sách hóa đơn bán hàng</span>
          </span>
        }
        className="cafe-shell-card"
        extra={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Input
              prefix={<Search size={14} color="#78716c" />}
              placeholder="Tìm mã HĐ, mã ĐH, khách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 210 }}
              allowClear
            />
            <Select
              value={methodFilter}
              onChange={setMethodFilter}
              style={{ width: 155 }}
              options={[
                { value: "ALL", label: "Tất cả hình thức" },
                { value: "CASH", label: "Tiền mặt" },
                { value: "BANK_TRANSFER", label: "Chuyển khoản" },
                { value: "CARD", label: "Quẹt thẻ POS" },
              ]}
            />
          </div>
        }
      >
        <Table
          rowKey="invoice_id"
          dataSource={filteredInvoices}
          pagination={{ pageSize: 7 }}
          scroll={{ x: 760 }}
          columns={[
            {
              title: "Mã HĐ",
              dataIndex: "invoice_id",
              width: 90,
              render: (id) => <Tag color="gold">{id}</Tag>,
            },
            {
              title: "Mã đơn",
              dataIndex: "order_id",
              width: 90,
              render: (oid) => <strong>{oid}</strong>,
            },
            {
              title: "Khách hàng",
              render: (_, row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{row.customerName}</div>
                  {row.customerPhone && (
                    <div style={{ fontSize: 12, color: "#78716c" }}>
                      {row.customerPhone}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: "Ngày xuất",
              dataIndex: "invoice_date",
              width: 115,
            },
            {
              title: "Hình thức",
              dataIndex: "payment_method",
              width: 135,
              render: (m) => {
                const info = METHOD_LABEL[m] || {
                  text: m,
                  color: "default",
                };
                return <Tag color={info.color}>{info.text}</Tag>;
              },
            },
            {
              title: "Tổng tiền",
              dataIndex: "total_amount",
              render: (v) => (
                <strong style={{ color: "#b45309", fontSize: 14 }}>
                  {formatVND(v)}
                </strong>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 105,
              render: (st) => <Tag color="green">{st}</Tag>,
            },
            {
              title: "Chi tiết",
              width: 105,
              render: (_, row) => (
                <Button
                  size="small"
                  className="btn-action-edit"
                  icon={<Eye size={13} />}
                  onClick={() => setSelectedInvoice(row)}
                >
                  Xem
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={`Chi tiết hóa đơn ${selectedInvoice?.invoice_id || ""}`}
        open={!!selectedInvoice}
        onCancel={() => setSelectedInvoice(null)}
        footer={[
          <Button
            key="print"
            icon={<Printer size={15} />}
            onClick={() => window.print()}
          >
            In hóa đơn
          </Button>,
          <Button
            key="close"
            type="primary"
            className="btn-add-primary"
            onClick={() => setSelectedInvoice(null)}
          >
            Đóng
          </Button>,
        ]}
      >
        {selectedInvoice && (
          <div className="receipt-preview-box">
            <Descriptions column={1} size="small" style={{ marginBottom: 14 }}>
              <Descriptions.Item label="Mã hóa đơn">
                <strong>{selectedInvoice.invoice_id}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Mã đơn hàng">
                {selectedInvoice.order_id}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {selectedInvoice.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày thanh toán">
                {selectedInvoice.invoice_date}
              </Descriptions.Item>
              <Descriptions.Item label="Hình thức">
                {METHOD_LABEL[selectedInvoice.payment_method]?.text ||
                  selectedInvoice.payment_method}
              </Descriptions.Item>
            </Descriptions>

            <div
              style={{
                borderTop: "1px dashed #d6cbb8",
                paddingTop: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 8,
                  color: "#44403c",
                }}
              >
                Sản phẩm đã mua
              </div>
              {(selectedInvoice.order?.items || []).map((it, i) => (
                <div
                  key={`${it.product_id}-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <span>
                    {it.product_name} <strong>x{it.quantity}</strong>
                  </span>
                  <strong>{formatVND(it.unit_price * it.quantity)}</strong>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1.5px solid #e7e0d2",
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 700 }}>Tổng thanh toán</span>
              <span
                style={{ fontWeight: 800, fontSize: 18, color: "#b45309" }}
              >
                {formatVND(selectedInvoice.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}