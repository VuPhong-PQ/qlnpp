import React, { useState } from 'react';
import './SetupPage.css';

const Products = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [products, setProducts] = useState([
    {
      id: 1,
      category: 'LH001',
      barcode: '8936000123456',
      code: 'SP001',
      name: 'Tivi Samsung 43 inch',
      vatName: 'Tivi Samsung 43 inch Smart TV',
      description: 'Tivi Samsung 43 inch màn hình phẳng',
      shelfLife: 24,
      baseUnit: 'Cái',
      retailPrice: 12000000,
      wholesalePrice: 11000000,
      weight: 15.5,
      volume: 0.8,
      unit1: 'Thùng',
      conversion1: 1,
      retailPrice1: 12000000,
      wholesalePrice1: 11000000,
      weight1: 15.5,
      volume1: 0.8,
      unit2: '',
      conversion2: 0,
      weight2: 0,
      volume2: 0,
      defaultUnit: 'Cái',
      minStock: 5,
      discount: 5,
      note: 'Sản phẩm hot',
      promotion: 'Giảm 10% cho đơn từ 2 cái',
      status: 'active'
    },
    {
      id: 2,
      category: 'LH002',
      barcode: '2345678901234',
      code: 'SP002',
      name: 'Thịt bò úc',
      vatName: 'Thịt bò nhập khẩu Úc',
      description: 'Thịt bò tươi nhập từ Úc',
      shelfLife: 0.5,
      baseUnit: 'Kg',
      retailPrice: 450000,
      wholesalePrice: 420000,
      weight: 1,
      volume: 0.001,
      unit1: 'Thùng',
      conversion1: 10,
      retailPrice1: 4500000,
      wholesalePrice1: 4200000,
      weight1: 10,
      volume1: 0.01,
      unit2: '',
      conversion2: 0,
      weight2: 0,
      volume2: 0,
      defaultUnit: 'Kg',
      minStock: 50,
      discount: 0,
      note: 'Bảo quản lạnh',
      promotion: '',
      status: 'active'
    }
  ]);

  const [formData, setFormData] = useState({
    category: '',
    barcode: '',
    code: '',
    name: '',
    vatName: '',
    description: '',
    shelfLife: 0,
    baseUnit: '',
    retailPrice: 0,
    wholesalePrice: 0,
    weight: 0,
    volume: 0,
    unit1: '',
    conversion1: 0,
    retailPrice1: 0,
    wholesalePrice1: 0,
    weight1: 0,
    volume1: 0,
    unit2: '',
    conversion2: 0,
    weight2: 0,
    volume2: 0,
    defaultUnit: '',
    minStock: 0,
    discount: 0,
    note: '',
    promotion: '',
    status: 'active'
  });

  const categories = ['LH001', 'LH002', 'LH003'];
  const units = ['Cái', 'Kg', 'Thùng', 'Gói', 'Chai', 'Hộp', 'Bao'];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setProducts(products.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      setProducts([...products, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: '',
      barcode: '',
      code: '',
      name: '',
      vatName: '',
      description: '',
      shelfLife: 0,
      baseUnit: '',
      retailPrice: 0,
      wholesalePrice: 0,
      weight: 0,
      volume: 0,
      unit1: '',
      conversion1: 0,
      retailPrice1: 0,
      wholesalePrice1: 0,
      weight1: 0,
      volume1: 0,
      unit2: '',
      conversion2: 0,
      weight2: 0,
      volume2: 0,
      defaultUnit: '',
      minStock: 0,
      discount: 0,
      note: '',
      promotion: '',
      status: 'active'
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setProducts(products.filter(item => item.id !== id));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Danh sách hàng hóa</h1>
        <p>Quản lý thông tin chi tiết sản phẩm và hàng hóa</p>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã sản phẩm hoặc mã vạch..."
            className="search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="table-actions">
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
                setEditingItem(null);
              }}
            >
              + Thêm sản phẩm
            </button>
            <button className="btn btn-success">📤 Export Excel</button>
            <button className="btn btn-secondary">📥 Import Excel</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Loại hàng</th>
                <th>Mã vạch</th>
                <th>Mã HH</th>
                <th>Tên hàng hóa</th>
                <th>Tên hàng VAT</th>
                <th>HSD (tháng)</th>
                <th>ĐVT gốc</th>
                <th>Giá bán lẻ</th>
                <th>Giá bán sỉ</th>
                <th>Tồn tối thiểu</th>
                <th>Chiết khấu (%)</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.category}</td>
                  <td>{product.barcode}</td>
                  <td>{product.code}</td>
                  <td>{product.name}</td>
                  <td>{product.vatName}</td>
                  <td>{product.shelfLife}</td>
                  <td>{product.baseUnit}</td>
                  <td>{formatCurrency(product.retailPrice)}</td>
                  <td>{formatCurrency(product.wholesalePrice)}</td>
                  <td>{product.minStock}</td>
                  <td>{product.discount}%</td>
                  <td>
                    <span className={`status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {product.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(product)}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(product.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Không tìm thấy sản phẩm nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} sản phẩm</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h4>Thông tin cơ bản</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Loại hàng <span className="required">*</span></label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn loại hàng</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mã vạch</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      placeholder="Nhập mã vạch"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mã hàng hóa <span className="required">*</span></label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Nhập mã hàng hóa"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Hạn sử dụng (tháng)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="shelfLife"
                      value={formData.shelfLife}
                      onChange={handleInputChange}
                      placeholder="VD: 24 hoặc 0.5"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Tên hàng hóa <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên hàng hóa"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Tên hàng VAT</label>
                  <input
                    type="text"
                    name="vatName"
                    value={formData.vatName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên hàng VAT"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Nhập mô tả sản phẩm"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Đơn vị tính gốc</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>ĐVT gốc <span className="required">*</span></label>
                    <select
                      name="baseUnit"
                      value={formData.baseUnit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn đơn vị</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Giá bán lẻ</label>
                    <input
                      type="number"
                      name="retailPrice"
                      value={formData.retailPrice}
                      onChange={handleInputChange}
                      placeholder="Nhập giá bán lẻ"
                    />
                  </div>
                  <div className="form-group">
                    <label>Giá bán sỉ</label>
                    <input
                      type="number"
                      name="wholesalePrice"
                      value={formData.wholesalePrice}
                      onChange={handleInputChange}
                      placeholder="Nhập giá bán sỉ"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số kg</label>
                    <input
                      type="number"
                      step="0.01"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="Nhập trọng lượng"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số khối (m³)</label>
                    <input
                      type="number"
                      step="0.001"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                      placeholder="Nhập thể tích"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Đơn vị tính 1</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>ĐVT1</label>
                    <select
                      name="unit1"
                      value={formData.unit1}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn đơn vị</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quy đổi 1</label>
                    <input
                      type="number"
                      name="conversion1"
                      value={formData.conversion1}
                      onChange={handleInputChange}
                      placeholder="Nhập tỷ lệ quy đổi"
                    />
                  </div>
                  <div className="form-group">
                    <label>Giá bán lẻ 1</label>
                    <input
                      type="number"
                      name="retailPrice1"
                      value={formData.retailPrice1}
                      onChange={handleInputChange}
                      placeholder="Nhập giá bán lẻ"
                    />
                  </div>
                  <div className="form-group">
                    <label>Giá bán sỉ 1</label>
                    <input
                      type="number"
                      name="wholesalePrice1"
                      value={formData.wholesalePrice1}
                      onChange={handleInputChange}
                      placeholder="Nhập giá bán sỉ"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số kg 1</label>
                    <input
                      type="number"
                      step="0.01"
                      name="weight1"
                      value={formData.weight1}
                      onChange={handleInputChange}
                      placeholder="Nhập trọng lượng"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số khối 1</label>
                    <input
                      type="number"
                      step="0.001"
                      name="volume1"
                      value={formData.volume1}
                      onChange={handleInputChange}
                      placeholder="Nhập thể tích"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Đơn vị tính 2</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>ĐVT2</label>
                    <select
                      name="unit2"
                      value={formData.unit2}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn đơn vị</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quy đổi 2</label>
                    <input
                      type="number"
                      name="conversion2"
                      value={formData.conversion2}
                      onChange={handleInputChange}
                      placeholder="Nhập tỷ lệ quy đổi"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số kg 2</label>
                    <input
                      type="number"
                      step="0.01"
                      name="weight2"
                      value={formData.weight2}
                      onChange={handleInputChange}
                      placeholder="Nhập trọng lượng"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số khối 2</label>
                    <input
                      type="number"
                      step="0.001"
                      name="volume2"
                      value={formData.volume2}
                      onChange={handleInputChange}
                      placeholder="Nhập thể tích"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Thông tin bổ sung</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>ĐVT mặc định</label>
                    <select
                      name="defaultUnit"
                      value={formData.defaultUnit}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn đơn vị mặc định</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tồn tối thiểu</label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      placeholder="Số lượng tồn tối thiểu"
                    />
                  </div>
                  <div className="form-group">
                    <label>Chiết khấu (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      placeholder="Phần trăm chiết khấu"
                    />
                  </div>
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Nhập ghi chú về sản phẩm"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Khuyến mãi</label>
                  <textarea
                    name="promotion"
                    value={formData.promotion}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Nhập thông tin chương trình khuyến mãi"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
