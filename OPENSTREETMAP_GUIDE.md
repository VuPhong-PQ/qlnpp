# Hướng dẫn sử dụng OpenStreetMap với Leaflet.js

## Giới thiệu

Ứng dụng sử dụng **OpenStreetMap** và **Leaflet.js** để hiển thị bản đồ - một giải pháp mã nguồn mở, miễn phí 100%, không cần API key và không giới hạn sử dụng!

### Ưu điểm so với Google Maps:
- ✅ **Miễn phí 100%** - Không tốn chi phí
- ✅ **Không cần API Key** - Cài đặt và sử dụng ngay
- ✅ **Không giới hạn** - Unlimited requests
- ✅ **Mã nguồn mở** - Cộng đồng hỗ trợ mạnh
- ✅ **Dữ liệu cập nhật** - Người dùng toàn cầu đóng góp

## Cài đặt

Thư viện đã được cài đặt sẵn:
```bash
npm install react-leaflet leaflet
```

Không cần cấu hình gì thêm - chỉ cần sử dụng!

## Cách sử dụng

### 1. Thêm vị trí cho khách hàng:

1. Mở trang **"Khách hàng"**
2. Click **"Thêm khách hàng"** hoặc **"Sửa"** khách hàng hiện có
3. Trong trường **"Vị trí"**, nhập tọa độ theo định dạng: `lat,lng`
   
   **Ví dụ:**
   - TP. Hồ Chí Minh: `10.8231,106.6297`
   - Hà Nội: `21.0285,105.8542`
   - Đà Nẵng: `16.0544,108.2022`
   - Cần Thơ: `10.0452,105.7469`

### 2. Tìm tọa độ trên OpenStreetMap:

**Cách 1: Sử dụng OpenStreetMap**
1. Truy cập [OpenStreetMap.org](https://www.openstreetmap.org)
2. Tìm kiếm địa chỉ hoặc di chuyển đến vị trí trên bản đồ
3. Click chuột phải → Chọn **"Show address"**
4. Tọa độ sẽ hiển thị ở thanh bên trái
5. Copy và paste vào trường "Vị trí"

**Cách 2: Sử dụng Google Maps (nhanh hơn)**
1. Mở [Google Maps](https://maps.google.com)
2. Tìm kiếm địa chỉ cần tìm
3. Click chuột phải vào vị trí trên bản đồ
4. Chọn tọa độ đầu tiên (sẽ được copy tự động)
5. Paste vào trường "Vị trí" trong form

**Cách 3: Dùng Nominatim Geocoding (tích hợp sẵn)**
- Nhập địa chỉ văn bản, hệ thống tự động chuyển thành tọa độ (tính năng có thể phát triển thêm)

### 3. Xem vị trí trên bản đồ:

1. Ở bảng danh sách khách hàng, tìm cột **"Vị trí"**
2. Click vào giá trị trong cột "Vị trí" (có icon 📍 và text màu xanh)
3. Bản đồ sẽ mở với:
   - **Marker** (chấm đỏ) đánh dấu vị trí khách hàng
   - **Animation** - Bản đồ tự động bay đến vị trí (flyTo effect)
   - **Popup** - Click vào marker để xem thông tin chi tiết
4. Có thể zoom in/out, kéo thả bản đồ thoải mái

### 4. Popup thông tin:

Khi click vào marker, popup hiển thị:
- 📝 Tên khách hàng
- 🏷️ Mã khách hàng
- 📍 Địa chỉ
- 📞 Số điện thoại
- 📧 Email

## Tính năng nâng cao

### Map Tiles có thể thay đổi:

Mặc định sử dụng OpenStreetMap tiles, có thể thay đổi sang các theme khác:

1. **OpenStreetMap Standard** (mặc định)
2. **OpenStreetMap HOT** - Humanitarian style
3. **CartoDB** - Style đẹp hơn
4. **Thunderforest** - Nhiều theme đa dạng

### Tích hợp thêm:

- **Geocoding**: Chuyển địa chỉ văn bản thành tọa độ
- **Routing**: Tính đường đi giữa các điểm
- **Clustering**: Gom nhóm marker khi zoom out
- **Heatmap**: Bản đồ nhiệt cho phân tích
- **Drawing**: Vẽ đa giác, đường kẻ trên bản đồ

## So sánh với Google Maps

| Tiêu chí | OpenStreetMap + Leaflet | Google Maps |
|----------|------------------------|-------------|
| Chi phí | **Miễn phí 100%** | $7/1000 requests |
| API Key | **Không cần** | Bắt buộc |
| Giới hạn | **Không giới hạn** | 28,000/tháng (free tier) |
| Cộng đồng | **Mã nguồn mở** | Closed source |
| Dữ liệu | Cập nhật từ cộng đồng | Google proprietary |
| Tùy chỉnh | **Rất linh hoạt** | Hạn chế |

## Lưu ý quan trọng

✅ **Không cần billing** - Hoàn toàn miễn phí
✅ **Không cần đăng ký** - Sử dụng ngay lập tức
✅ **Production ready** - Tin cậy cho sản phẩm thực tế
✅ **Offline support** - Có thể cache tiles cho offline

## Tài liệu tham khảo

- [Leaflet.js Official Docs](https://leafletjs.com/)
- [React-Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim API](https://nominatim.org/) - Geocoding service miễn phí

## Troubleshooting

**Vấn đề: Marker không hiển thị**
- Đảm bảo CSS của Leaflet được import: `import 'leaflet/dist/leaflet.css'`
- Kiểm tra định dạng tọa độ: `lat,lng` (có dấu phẩy)

**Vấn đề: Bản đồ bị vỡ**
- Kiểm tra internet connection
- Thử reload trang
- Clear cache trình duyệt

**Vấn đề: Performance chậm**
- Giảm số lượng marker nếu có nhiều (dùng clustering)
- Tối ưu zoom level mặc định
