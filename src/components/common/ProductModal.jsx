import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';
import { API_ENDPOINTS, api } from '../../config/api';

const ProductModal = ({ open, onClose, initialData = {}, onSave, onSaveCopy }) => {
  const [form, setForm] = useState({});
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    setForm({
      category: '', barcode: '', productCode: '', productName: '', productNameVat: '', description: '', hsdMonths: 0,
      defaultUnit: '', priceImport: 0, priceRetail: 0, priceWholesale: 0,
      unit1Name: '', unit1Conversion: 0, unit1Price: 0, unit1Discount: 0,
      unit2Name: '', unit2Conversion: 0, unit2Price: 0, unit2Discount: 0,
      unit3Name: '', unit3Conversion: 0, unit3Price: 0, unit3Discount: 0,
      unit4Name: '', unit4Conversion: 0, unit4Price: 0, unit4Discount: 0,
      weight: 0, volume: 0, warehouse: '', note: '',
      ...initialData
    });
  }, [initialData, open]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const cats = await api.get(API_ENDPOINTS.productCategories);
        setCategories(cats || []);
      } catch (e) { setCategories([]); }
      try {
        const us = await api.get(API_ENDPOINTS.units);
        setUnits(us || []);
      } catch (e) { setUnits([]); }
    };
    if (open) fetchLookups();
  }, [open]);

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.productName || String(form.productName).trim() === '') {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    onSave && onSave(form);
  };

  const handleSaveCopy = () => {
    if (!form.productName || String(form.productName).trim() === '') {
      alert('Vui lòng nhập Tên hàng');
      return;
    }
    onSaveCopy && onSaveCopy(form);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="THÔNG TIN HÀNG HÓA"
      footer={(
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          <button className="btn" style={{background:'#79c700',color:'#fff',borderRadius:6}} onClick={handleSaveCopy}>Lưu (Copy)</button>
          <button className="btn btn-primary" onClick={handleSave}>Lưu lại</button>
        </div>
      )}
      width={'95%'}
      style={{ maxWidth: 1820 }}
      styles={{ body: { maxHeight: '90vh', overflow: 'auto' } }}
    >
      <div className="product-modal">
        <div className="product-grid">
          <div className="row">
            <div className="col-3">
              <label className="field-label">Loại hàng</label>
              <div style={{display:'flex',gap:8}}>
                <select value={form.category} onChange={e=>handleChange('category', e.target.value)}>
                  <option value="">Chọn nhóm hàng hóa</option>
                  {categories.map(c=> (<option key={c.id} value={c.code}>{c.name}</option>))}
                </select>
                <button className="btn" style={{background:'#2db7f5',color:'#fff',borderRadius:6}}>+</button>
              </div>
            </div>
            <div className="col-5">
              <label className="field-label">Mã vạch</label>
              <input value={form.barcode||''} onChange={e=>handleChange('barcode', e.target.value)} />
            </div>
            <div className="col-4">
              <label className="field-label required">Mã hàng</label>
              <input value={form.productCode||''} onChange={e=>handleChange('productCode', e.target.value)} />
            </div>
          </div>

          <div className="row">
            <div className="col-8">
              <label className="field-label required">Tên hàng</label>
              <input value={form.productName||''} onChange={e=>handleChange('productName', e.target.value)} />
            </div>
            <div className="col-4">
              <label className="field-label">Tên hàng VAT</label>
              <input value={form.productNameVat||''} onChange={e=>handleChange('productNameVat', e.target.value)} />
            </div>
          </div>

          <div className="row">
            <div className="col-9">
              <label className="field-label">Mô tả</label>
              <textarea value={form.description||''} onChange={e=>handleChange('description', e.target.value)} style={{minHeight:64}} />
            </div>
            <div className="col-3">
              <label className="field-label">HSD (Tháng)</label>
              <input type="number" value={form.hsdMonths||0} onChange={e=>handleChange('hsdMonths', Number(e.target.value||0))} />
            </div>
          </div>

          <div className="unit-table">
            <div className="unit-row header">
              <div>Đvt</div>
              <div>Quy đổi</div>
              <div>Giá nhập</div>
              <div>Giá bán lẻ</div>
              <div>Giá bán sỉ</div>
              <div>Số Kg</div>
              <div>Số khối</div>
            </div>
            {['default','unit1','unit2','unit3','unit4'].map((uk, idx) => (
              <div className="unit-row" key={uk}>
                <div>
                  {uk==='default' ? (
                    <select value={form.defaultUnit||''} onChange={e=>handleChange('defaultUnit', e.target.value)}>
                      <option value="">Chọn đơn vị</option>
                      {units.map(u=>(<option key={u.id} value={u.code}>{u.name}</option>))}
                    </select>
                  ) : (
                    <input placeholder={uk.toUpperCase()} value={form[uk+'Name']||''} onChange={e=>handleChange(uk+'Name', e.target.value)} />
                  )}
                </div>
                <div><input type="number" value={form[uk+'Conversion']||0} onChange={e=>handleChange(uk+'Conversion', Number(e.target.value||0))} /></div>
                <div><input type="number" value={form[uk==='default'?'priceImport':uk+'Price']||0} onChange={e=>handleChange(uk==='default'?'priceImport':uk+'Price', Number(e.target.value||0))} /></div>
                <div><input type="number" value={form[uk==='default'?'priceRetail':uk+'Retail']||0} onChange={e=>handleChange(uk==='default'?'priceRetail':uk+'Retail', Number(e.target.value||0))} /></div>
                <div><input type="number" value={form[uk==='default'?'priceWholesale':uk+'Wholesale']||0} onChange={e=>handleChange(uk==='default'?'priceWholesale':uk+'Wholesale', Number(e.target.value||0))} /></div>
                <div><input type="number" value={form.weight||0} onChange={e=>handleChange('weight', Number(e.target.value||0))} /></div>
                <div><input type="number" value={form.volume||0} onChange={e=>handleChange('volume', Number(e.target.value||0))} /></div>
              </div>
            ))}
          </div>

          <div className="row bottom-cols">
            <div style={{flex:1}}>
              <label className="field-label">Đvt mặc định</label>
              <select value={form.defaultUnit||''} onChange={e=>handleChange('defaultUnit', e.target.value)}>
                {units.map(u=>(<option key={u.id} value={u.code}>{u.name}</option>))}
              </select>
              <div style={{display:'flex',gap:12,marginTop:8}}>
                <div style={{flex:1}}>
                  <label className="field-label">Tồn tối thiểu</label>
                  <input type="number" />
                </div>
                <div style={{flex:1}}>
                  <label className="field-label">Chiết khấu</label>
                  <input type="number" />
                </div>
                <div style={{flex:2}}>
                  <label className="field-label">Ghi chú</label>
                  <input value={form.note||''} onChange={e=>handleChange('note', e.target.value)} />
                </div>
              </div>
              <div style={{marginTop:8}}>
                <label className="field-label">Khuyến mại</label>
                <textarea style={{width:'100%',minHeight:60}} value={form.promotion||''} onChange={e=>handleChange('promotion', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="row">
            <div style={{flex:1}}>
              <label className="field-label">Hình ảnh hàng hóa</label>
              <div style={{border:'1px dashed #e5e7eb',padding:12,textAlign:'center',borderRadius:6}}>Click hoặc di chuyển file vào khung</div>
            </div>
            <div style={{flex:1,display:'flex',alignItems:'end',paddingLeft:12}}>
              <label style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="checkbox" /> Ngưng hoạt động
              </label>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductModal;
