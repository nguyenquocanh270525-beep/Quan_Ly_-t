import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Pagination,
  message,
  Popconfirm,
} from "antd";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  getDB,
  formatVND,
  addProductService,
  updateProductService,
  deleteProductService,
} from "../../services/storageService";

const PAGE_SIZE = 8;

export default function ProductsPage() {
  const [, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const db = getDB() || { products: [], brands: [], categories: [] };
  const refresh = () => setTick((t) => t + 1);

  const brandMap = Object.fromEntries(
    db.brands.map((b) => [b.brand_id, b.brand_name])
  );
  const catMap = Object.fromEntries(
    db.categories.map((c) => [c.category_id, c.category_name])
  );

  const filtered = db.products.filter((p) => {
    const matchText =
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_id.toLowerCase().includes(search.toLowerCase());
    const matchBrand = brandFilter === "ALL" || p.brand_id === brandFilter;
    const matchCat = catFilter === "ALL" || p.category_id === catFilter;
    return matchText && matchBrand && matchCat;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, brandFilter, catFilter]);

  const paginatedProducts = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openModal = (prod = null) => {
    setEditing(prod);
    if (prod) {
      form.setFieldsValue(prod);
    } else {
      form.resetFields();
      form.setFieldsValue({
        category_id: "CAT01",
        brand_id: "BR01",
        color: "Đen",
        storage: "256GB",
        ram: "8GB",
        import_price: 10000000,
        selling_price: 12000000,
        quantity: 10,
        status: "ACTIVE",
      });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        updateProductService(editing.product_id, values);
        message.success("Đã cập nhật sản phẩm");
      } else {
        addProductService(values);
        message.success("Đã thêm sản phẩm mới");
      }
      setOpen(false);
      refresh();
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = (id) => {
    deleteProductService(id);
    message.success("Đã xóa sản phẩm");
    refresh();
  };

  return (
    <div>
      <Card className="cafe-shell-card" style={{ marginBottom: 18 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Space wrap>
              <Input
                prefix={<Search size={14} color="#78716c" />}
                placeholder="Tìm tên máy, mã SP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
              <Select
                value={brandFilter}
                onChange={setBrandFilter}
                style={{ width: 165 }}
                options={[
                  { value: "ALL", label: "Tất cả thương hiệu" },
                  ...db.brands.map((b) => ({
                    value: b.brand_id,
                    label: b.brand_name,
                  })),
                ]}
              />
              <Select
                value={catFilter}
                onChange={setCatFilter}
                style={{ width: 165 }}
                options={[
                  { value: "ALL", label: "Tất cả danh mục" },
                  ...db.categories.map((c) => ({
                    value: c.category_id,
                    label: c.category_name,
                  })),
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button
              className="btn-add-primary"
              icon={<Plus size={16} />}
              onClick={() => openModal(null)}
            >
              Thêm sản phẩm
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {paginatedProducts.map((p) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={p.product_id}>
            <div className="showcase-product-card">
              <div>
                <div className="showcase-img-stage">
                  <img src={p.image} alt={p.product_name} />
                  <Tag
                    color={p.quantity <= 5 ? "volcano" : "green"}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      borderRadius: 999,
                      fontWeight: 700,
                      paddingInline: 10,
                    }}
                  >
                    Tồn: {p.quantity}
                  </Tag>
                </div>

                <div style={{ padding: "14px 14px 8px" }}>
                  <Space size={6} style={{ marginBottom: 8 }}>
                    <Tag color="gold" style={{ fontWeight: 600, borderRadius: 6 }}>
                      {brandMap[p.brand_id] || p.brand_id}
                    </Tag>
                    <Tag style={{ borderRadius: 6 }}>
                      {catMap[p.category_id] || p.category_id}
                    </Tag>
                  </Space>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    {p.product_name}
                  </div>
                  <div style={{ color: "#78716c", fontSize: 12, marginBottom: 10 }}>
                    {p.color} • {p.storage} • RAM {p.ram}
                  </div>

                  <div
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      fontWeight: 800,
                      fontSize: 16,
                      padding: "6px 10px",
                      borderRadius: 10,
                      display: "inline-block",
                    }}
                  >
                    {formatVND(p.selling_price)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  padding: "10px 14px 14px",
                  borderTop: "1px dashed #ebe5d8",
                  marginTop: 6,
                }}
              >
                <Button
                  className="btn-action-edit"
                  icon={<Edit size={14} />}
                  onClick={() => openModal(p)}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa sản phẩm này?"
                  onConfirm={() => handleDelete(p.product_id)}
                >
                  <Button className="btn-action-delete" icon={<Trash2 size={14} />}>
                    Xóa
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {filtered.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showTotal={(total) => `Tổng ${total} sản phẩm (8 / trang)`}
          />
        </div>
      )}

      <Modal
        title={editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
        open={open}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_name"
            label="Tên sản phẩm"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ví dụ: iPhone 16 128GB Đen" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="brand_id"
                label="Thương hiệu"
                rules={[{ required: true }]}
              >
                <Select
                  options={db.brands.map((b) => ({
                    value: b.brand_id,
                    label: b.brand_name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="Danh mục"
                rules={[{ required: true }]}
              >
                <Select
                  options={db.categories.map((c) => ({
                    value: c.category_id,
                    label: c.category_name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="color" label="Màu sắc">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="storage" label="Dung lượng">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ram" label="RAM">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="import_price"
                label="Giá nhập"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="selling_price"
                label="Giá bán"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Số lượng tồn"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}