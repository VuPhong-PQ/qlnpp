# Quản Lý Nhà Phân Phối (QLNPP)

Hệ thống quản lý nhà phân phối được xây dựng bằng React + Vite, hỗ trợ quản lý toàn diện các hoạt động kinh doanh của doanh nghiệp phân phối.

## 🚀 Tính năng chính

### 📊 Dashboard
- Tổng quan doanh thu, đơn hàng, khách hàng
- Thống kê tồn kho theo thời gian thực
- Danh sách đơn hàng gần đây
- Các thao tác nhanh thường dùng

### ⚙️ Thiết lập ban đầu
- **Thông tin doanh nghiệp**: Cấu hình thông tin cơ bản, ngân hàng, thông tin liên hệ
- **Tài khoản quỹ & Nợ ngân hàng**: Quản lý quỹ tiền mặt và các khoản vay
- **Nhóm khách hàng**: Phân loại khách hàng theo nhóm và lịch bán hàng
- **Khách hàng**: Quản lý hồ sơ khách hàng, công nợ, thông tin xuất VAT
- **Nhà cung cấp**: Quản lý danh sách nhà cung cấp và loại hàng hóa

### 💼 Quản lý nghiệp vụ
- Bảng báo giá
- Đặt hàng NCC
- Nhập hàng
- Chuyển kho
- Bán hàng
- Phiếu thu/chi
- Tính giá vốn
- Xuất kho
- Điều chỉnh kho
- Khách trả hàng

### 📈 Báo cáo thống kê
- Báo cáo bán hàng
- Báo cáo tồn kho
- Báo cáo tài chính

### 🔐 Phân quyền
- Quản lý vai trò người dùng
- Phân quyền truy cập chức năng

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, React Router DOM
- **Build Tool**: Vite 7
- **Styling**: CSS3 với design system tùy chỉnh
- **Development**: ESLint, Hot Module Replacement (HMR)

## 📦 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 20.19.0
- npm >= 10.8.2

### Cài đặt
```bash
# Clone repository
git clone https://github.com/VuPhong-PQ/qlnpp.git
cd qlnpp

# Cài đặt dependencies
npm install

# Chạy development server
npm start
# hoặc
npm run dev

# Build cho production
npm run build

# Preview production build
npm run preview
```

## 🎨 Tính năng UI/UX

- **Responsive Design**: Tự động điều chỉnh giao diện cho mobile/tablet
- **Modern UI**: Giao diện hiện đại với gradient và shadow effects
- **Navigation**: Menu dropdown với hover effects mượt mà
- **Forms**: Form validation và modal popup chuyên nghiệp
- **Data Tables**: Bảng dữ liệu với search, sort, export/import Excel
- **Status Indicators**: Badge trạng thái với color coding

## 📁 Cấu trúc dự án

```
src/
├── components/
│   ├── Header.jsx          # Navigation menu với dropdown
│   ├── Dashboard.jsx       # Trang dashboard chính
│   └── setup/              # Các trang thiết lập ban đầu
│       ├── CompanyInfo.jsx     # Thông tin doanh nghiệp
│       ├── AccountsFunds.jsx   # Quỹ & nợ ngân hàng
│       ├── CustomerGroups.jsx  # Nhóm khách hàng
│       ├── Customers.jsx       # Khách hàng
│       ├── Suppliers.jsx       # Nhà cung cấp
│       └── SetupPage.css       # Styles chung cho setup pages
├── App.jsx                 # Main application component
├── App.css                 # Global styles
├── index.css               # Reset CSS và base styles
└── main.jsx                # Application entry point
```

## 🔧 Cấu hình

### Vite Configuration
- Auto open Chrome khi start development server
- React plugin với Fast Refresh
- ESLint integration

### Routing
- React Router DOM với dynamic navigation
- Nested routes cho các module
- Active route highlighting

## 🚀 Triển khai

```bash
# Build production
npm run build

# Serve production build locally
npm run preview
```

## 📝 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Tác giả

**Vũ Phong** - [VuPhong-PQ](https://github.com/VuPhong-PQ)

## 📞 Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng tạo issue trên GitHub repository.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
