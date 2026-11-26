import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Input,
  Segmented,
  AutoComplete,
  Button,
  Tag,
  Space,
  Card,
  Table,
  Pagination,
  message,
  Popconfirm,
  Empty,
} from "antd";
import { Search, Plus, Minus, Trash2, ReceiptText, ShoppingBag } from "lucide-react";
import {
  getDB,
  formatVND,
  createOrderService,
  cancelOrderService,
} from "../../services/storageService";
import { useAuth } from "../../contexts/AuthContext";

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState([]);

  const db = getDB() || { products: [], categories: [], customers: [], orders: [] };
  const refresh = () => setTick((t) => t + 1);

  const categoryOptions = [
    { label: "Tất cả", value: "ALL" },
    ...db.categories.map((c) => ({ label: c.category_name, value: c.category_id })),
  ];

  const visibleProducts = db.products.filter((p) => {
    const matchCat = selectedCat === "ALL" || p.category_id === selectedCat;
    const matchSearch =
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.color.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCat, search]);

  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getCartQty = (productId) => {
    const found = cart.find((c) => c.product_id === productId);
    return found ? found.quantity : 0;
  };

  const handleQuickAdd = (prod) => {
    if (prod.quantity <= 0) {
      return message.warning(`"${prod.product_name}" đã hết hàng`);
    }
    const existing = cart.find((item) => item.product_id === prod.product_id);
    if (existing) {
      if (existing.quantity + 1 > prod.quantity) {
        return message.error(`Chỉ còn ${prod.quantity} sản phẩm trong kho`);
      }
      setCart(
        cart.map((item) =>
          item.product_id === prod.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: prod.product_id,
          product_name: prod.product_name,
          unit_price: prod.selling_price,
          quantity: 1,
          maxStock: prod.quantity,
        },
      ]);
    }
    message.success({ content: `+ ${prod.product_name}`, duration: 0.9 });
  };

  const changeQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.maxStock) {
            message.warning(`Tối đa ${item.maxStock} sản phẩm`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean)
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const handleCreateOrder = () => {
    try {
      createOrderService({
        customer_name: customerName,
        employee_id: user.user_id,
        items: cart,
        note,
      });
      message.success("Đã tạo đơn hàng! Chuyển sang mục Thanh toán để thu tiền.");
      setCart([]);
      setNote("");
      setCustomerName("");
      refresh();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCancelOrder = (orderId) => {
    try {
      cancelOrderService(orderId);
      message.success("Đã hủy đơn và hoàn lại tồn kho");
      refresh();
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div>
      <Row gutter={[18, 18]} align="top">
        <Col xs={24} xl={15}>
          <Card className="cafe-shell-card" style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Segmented
                options={categoryOptions}
                value={selectedCat}
                onChange={setSelectedCat}
              />
              <Input
                prefix={<Search size={15} color="#78716c" />}
                placeholder="Tìm nhanh iPhone, Samsung, sạc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
            </div>
          </Card>

          <Row gutter={[14, 14]}>
            {paginatedProducts.map((p) => {
              const inCartQty = getCartQty(p.product_id);
              return (
                <Col xs={24} sm={12} md={8} key={p.product_id}>
                  <div
                    className={`showcase-product-card ${
                      inCartQty > 0 ? "is-in-cart" : ""
                    }`}
                    onClick={() => handleQuickAdd(p)}
                    style={{ cursor: "pointer" }}
                  >
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
                          }}
                        >
                          Kho: {p.quantity}
                        </Tag>
                        {inCartQty > 0 && (
                          <Tag
                            color="amber"
                            style={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              borderRadius: 999,
                              fontWeight: 800,
                            }}
                          >
                            Đang chọn: {inCartQty}
                          </Tag>
                        )}
                      </div>

                      <div style={{ padding: "12px 14px 6px" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#0f172a",
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.product_name}
                        </div>
                        <div style={{ fontSize: 12, color: "#78716c", marginBottom: 8 }}>
                          {p.color} • {p.storage}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "8px 14px 14px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          color: "#b45309",
                        }}
                      >
                        {formatVND(p.selling_price)}
                      </span>
                      <Button
                        size="small"
                        className="btn-add-primary"
                        icon={<ShoppingBag size={13} />}
                        style={{ borderRadius: 8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(p);
                        }}
                      >
                        Chọn
                      </Button>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {visibleProducts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={visibleProducts.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total) => `${total} sản phẩm (8 / trang)`}
              />
            </div>
          )}
        </Col>

        <Col xs={24} xl={9}>
          <div className="pos-cart-panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: "1px dashed #e5dec9",
              }}
            >
              <ReceiptText size={18} color="#d97706" />
              <span>Phiếu bán hàng</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>
                Khách hàng
              </div>
              <AutoComplete
                style={{ width: "100%" }}
                value={customerName}
                onChange={(val) => setCustomerName(val)}
                placeholder="Nhập tên khách hàng (VD: Nguyễn Văn A)..."
                allowClear
                options={db.customers.map((c) => ({
                  value: c.full_name,
                  label: `${c.full_name} (${c.phone})`,
                }))}
                filterOption={(inputValue, option) =>
                  (option?.value || "")
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </div>

            {cart.length === 0 ? (
              <Empty
                description="Bấm vào sản phẩm bên trái để thêm vào đơn"
                style={{ padding: "28px 0" }}
              />
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 14 }}>
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f5f2eb",
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.product_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                        {formatVND(item.unit_price * item.quantity)}
                      </div>
                    </div>

                    <Space size={4}>
                      <Button
                        size="small"
                        icon={<Minus size={12} />}
                        onClick={() => changeQty(item.product_id, -1)}
                      />
                      <span style={{ minWidth: 22, textAlign: "center", fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <Button
                        size="small"
                        icon={<Plus size={12} />}
                        onClick={() => changeQty(item.product_id, 1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={() =>
                          setCart(cart.filter((c) => c.product_id !== item.product_id))
                        }
                      />
                    </Space>
                  </div>
                ))}
              </div>
            )}

            <Input
              placeholder="Ghi chú đơn hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ marginBottom: 14 }}
            />

            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontWeight: 600, color: "#78350f" }}>
                Tổng thanh toán
              </span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#b45309" }}>
                {formatVND(totalAmount)}
              </span>
            </div>

            <Button
              type="primary"
              size="large"
              block
              className="btn-add-primary"
              onClick={handleCreateOrder}
              style={{ height: 44, fontWeight: 700 }}
            >
              Tạo đơn hàng
            </Button>
          </div>
        </Col>
      </Row>

      <Card title="Đơn hàng đã tạo" className="cafe-shell-card" style={{ marginTop: 20 }}>
        <Table
          rowKey="order_id"
          dataSource={db.orders}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: "Mã đơn", dataIndex: "order_id" },
            { title: "Ngày tạo", dataIndex: "order_date" },
            {
              title: "Tổng tiền",
              dataIndex: "total_amount",
              render: (v) => <strong>{formatVND(v)}</strong>,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (st) => {
                const color =
                  st === "PAID" ? "green" : st === "CANCELLED" ? "red" : "gold";
                return <Tag color={color}>{st}</Tag>;
              },
            },
            {
              title: "Thao tác",
              render: (_, row) =>
                row.status === "PENDING" ? (
                  <Popconfirm
                    title="Hủy đơn này và hoàn lại tồn kho?"
                    onConfirm={() => handleCancelOrder(row.order_id)}
                  >
                    <Button className="btn-action-delete" size="small">
                      Hủy đơn
                    </Button>
                  </Popconfirm>
                ) : null,
            },
          ]}
        />
      </Card>
    </div>
  );
}