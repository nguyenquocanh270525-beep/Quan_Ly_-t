import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Tag,
  Input,
  message,
} from "antd";
import {
  PackagePlus,
  Truck,
  Layers,
  WalletCards,
  Search,
} from "lucide-react";
import {
  getDB,
  formatVND,
  createImportService,
} from "../../services/storageService";
import { useAuth } from "../../contexts/AuthContext";

export default function ImportsPage() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const db = getDB() || {
    products: [],
    suppliers: [],
    imports: [],
    users: [],
  };
  const refresh = () => setTick((t) => t + 1);

  const selectedProductId = Form.useWatch("product_id", form);
  const watchedQty = Form.useWatch("quantity", form);
  const watchedPrice = Form.useWatch("import_price", form);

  const currentProd = db.products.find(
    (p) => p.product_id === selectedProductId
  );

  const handleProductChange = (prodId) => {
    const found = db.products.find((p) => p.product_id === prodId);
    if (found && !form.getFieldValue("import_price")) {
      form.setFieldsValue({ import_price: found.import_price });
    }
  };

  const onFinish = (values) => {
    try {
      createImportService({
        supplier_id: values.supplier_id,
        employee_id: user?.user_id || "U01",
        product_id: values.product_id,
        quantity: values.quantity,
        import_price: values.import_price,
      });
      message.success("Đã nhập kho và cộng tồn sản phẩm thành công!");
      form.resetFields();
      refresh();
    } catch (err) {
      message.error(err.message);
    }
  };

  const supplierMap = Object.fromEntries(
    (db.suppliers || []).map((s) => [s.supplier_id, s.supplier_name])
  );
  const userMap = Object.fromEntries(
    (db.users || []).map((u) => [u.user_id, u.full_name])
  );

  const importsList = db.imports || [];
  const filteredImports = importsList.filter((imp) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const supName = (supplierMap[imp.supplier_id] || "").toLowerCase();
    return (
      (imp.import_id || "").toLowerCase().includes(q) ||
      (imp.product_name || "").toLowerCase().includes(q) ||
      supName.includes(q)
    );
  });

  const totalImportValue = importsList.reduce(
    (sum, r) => sum + Number(r.total_amount || 0),
    0
  );
  const totalImportedUnits = importsList.reduce(
    (sum, r) => sum + Number(r.quantity || 0),
    0
  );
  const previewTotal = Number(watchedQty || 0) * Number(watchedPrice || 0);

  return (
    <div>
      {/* 3 thẻ tổng quan nhập hàng */}
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
              <span className="retail-summary-label">Tổng phiếu nhập</span>
              <Truck size={18} color="#d97706" />
            </div>
            <div className="retail-summary-value">{importsList.length} phiếu</div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              {(db.suppliers || []).length} nhà phân phối liên kết
            </div>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="retail-summary-label">Tổng máy / phụ kiện nhập</span>
              <Layers size={18} color="#0f766e" />
            </div>
            <div className="retail-summary-value">{totalImportedUnits} SP</div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Tự động cập nhật số lượng tồn kho
            </div>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div className="retail-summary-box">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="retail-summary-label">Tổng giá trị nhập kho</span>
              <WalletCards size={18} color="#b45309" />
            </div>
            <div
              className="retail-summary-value"
              style={{ color: "#b45309" }}
            >
              {formatVND(totalImportValue)}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
              Tính theo giá vốn từng phiếu nhập
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[18, 18]} align="top">
        {/* Form tạo phiếu nhập gọn gàng, không điền trước */}
        <Col xs={24} lg={9}>
          <Card
            size="small"
            title={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  paddingBlock: 4,
                }}
              >
                <PackagePlus size={17} color="#d97706" />
                <span>Lập phiếu nhập hàng</span>
              </span>
            }
            className="cafe-shell-card"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              style={{ marginTop: 4 }}
            >
              <Form.Item
                name="supplier_id"
                label="Nhà cung cấp"
                style={{ marginBottom: 12 }}
                rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}
              >
                <Select
                  placeholder="Chọn nhà cung cấp..."
                  allowClear
                  options={(db.suppliers || []).map((s) => ({
                    value: s.supplier_id,
                    label: `${s.supplier_name} • ${s.phone}`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="product_id"
                label="Sản phẩm nhập kho"
                style={{ marginBottom: 12 }}
                rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
              >
                <Select
                  placeholder="Chọn sản phẩm..."
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  onChange={handleProductChange}
                  options={(db.products || []).map((p) => ({
                    value: p.product_id,
                    label: `${p.product_name} (Tồn: ${p.quantity})`,
                  }))}
                />
              </Form.Item>

              {currentProd && (
                <div
                  style={{
                    background: "#faf6ee",
                    border: "1px solid #ebe3d3",
                    borderRadius: 10,
                    padding: "8px 10px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <img
                    src={currentProd.image}
                    alt={currentProd.product_name}
                    style={{
                      width: 36,
                      height: 36,
                      objectFit: "contain",
                      borderRadius: 6,
                      background: "#fff",
                      padding: 3,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: "#1e293b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {currentProd.product_name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#78716c" }}>
                      Tồn: <strong>{currentProd.quantity}</strong> • Giá bán:{" "}
                      <strong>{formatVND(currentProd.selling_price)}</strong>
                    </div>
                  </div>
                </div>
              )}

              <Row gutter={10}>
                <Col span={9}>
                  <Form.Item
                    name="quantity"
                    label="Số lượng"
                    style={{ marginBottom: 12 }}
                    rules={[{ required: true, message: "Nhập SL" }]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="SL"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={15}>
                  <Form.Item
                    name="import_price"
                    label="Giá nhập (VNĐ)"
                    style={{ marginBottom: 12 }}
                    rules={[{ required: true, message: "Nhập giá nhập" }]}
                  >
                    <InputNumber
                      min={0}
                      step={100000}
                      placeholder="Nhập giá nhập..."
                      style={{ width: "100%" }}
                      formatter={(v) =>
                        v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
                      }
                      parser={(v) => (v ? v.replace(/\./g, "") : 0)}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#78350f" }}>
                  Thành tiền phiếu nhập
                </span>
                <span
                  style={{ fontWeight: 800, fontSize: 15.5, color: "#b45309" }}
                >
                  {formatVND(previewTotal)}
                </span>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                className="btn-add-primary"
                style={{ height: 38, fontWeight: 700, borderRadius: 10 }}
              >
                Xác nhận nhập kho
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Lịch sử phiếu nhập */}
        <Col xs={24} lg={15}>
          <Card
            title="Lịch sử phiếu nhập kho"
            className="cafe-shell-card"
            extra={
              <Input
                prefix={<Search size={14} color="#78716c" />}
                placeholder="Tìm mã PN, tên SP, NCC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
            }
          >
            <Table
              rowKey="import_id"
              dataSource={filteredImports}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 720 }}
              columns={[
                {
                  title: "Mã PN",
                  dataIndex: "import_id",
                  width: 85,
                  render: (id) => <Tag color="gold">{id}</Tag>,
                },
                {
                  title: "Sản phẩm",
                  dataIndex: "product_name",
                  render: (name) => <strong>{name}</strong>,
                },
                {
                  title: "Nhà cung cấp",
                  dataIndex: "supplier_id",
                  render: (sid) => supplierMap[sid] || sid,
                },
                {
                  title: "SL",
                  dataIndex: "quantity",
                  width: 70,
                  render: (q) => <Tag color="green">+{q}</Tag>,
                },
                {
                  title: "Thành tiền",
                  dataIndex: "total_amount",
                  render: (v) => (
                    <strong style={{ color: "#b45309" }}>
                      {formatVND(v)}
                    </strong>
                  ),
                },
                {
                  title: "Ngày / NV",
                  render: (_, row) => (
                    <div style={{ fontSize: 12, color: "#57534e" }}>
                      <div>{row.import_date}</div>
                      <div>{userMap[row.employee_id] || row.employee_id}</div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}