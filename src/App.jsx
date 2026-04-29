import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, Trash2, Search, X, FileText, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import initialProducts from './data/products.json';

function App() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('plotter_inventory');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  
  const [quoteItems, setQuoteItems] = useState([]);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'inventory'
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Product State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Repuestos',
    image: '',
    stock: 0
  });
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    ruc: '',
    address: '',
    phone: ''
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    localStorage.setItem('plotter_inventory', JSON.stringify(products));
  }, [products]);

  const addToQuote = (product) => {
    setQuoteItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {...item, qty: item.qty + 1} : item);
      }
      return [...prev, {...product, qty: 1}];
    });
    setIsQuoteOpen(true);
  };

  const removeFromQuote = (id) => {
    setQuoteItems(prev => prev.filter(item => item.id !== id));
  };

  const saveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { 
        ...p, 
        ...newProduct, 
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock) || 0
      } : p));
      setEditingProduct(null);
    } else {
      const product = {
        ...newProduct,
        id: Date.now(),
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock) || 0
      };
      setProducts([product, ...products]);
    }
    setNewProduct({ name: '', price: '', category: 'Repuestos', image: '' });
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      stock: product.stock || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const totalPrice = quoteItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const quoteNumber = `CP-${Math.floor(1000 + Math.random() * 9000)}`;
    const brandColor = [125, 206, 209]; // #7dced1

    // White Header Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 45, 'F');

    // Separator Line
    doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.setLineWidth(1);
    doc.line(15, 40, 195, 40);

    // Logo
    try {
      doc.addImage('/logo.png', 'PNG', 15, 10, 60, 15);
    } catch (e) {
      doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PLOTTERPEDIA', 15, 25);
    }

    // Quote Details (Header Sides)
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN PROFESIONAL', 195, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`N°: ${quoteNumber}`, 195, 26, { align: 'right' });
    doc.text(`Fecha: ${date}`, 195, 31, { align: 'right' });

    // Client Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DIRIGIDO A:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${clientInfo.name || '---'}`, 15, 62);
    doc.text(`Teléfono: ${clientInfo.phone || '---'}`, 15, 67);
    doc.text(`DNI/RUC: ${clientInfo.ruc || '---'}`, 15, 72);
    doc.text(`Dirección: ${clientInfo.address || '---'}`, 15, 77);

    // Table
    const tableColumn = ["Producto", "Cant.", "Precio Unit.", "Total"];
    const tableRows = [];
    quoteItems.forEach(item => {
      tableRows.push([
        item.name, 
        item.qty, 
        `$${item.price.toLocaleString()}`, 
        `$${(item.price * item.qty).toLocaleString()}`
      ]);
    });

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [125, 206, 209] },
    });

    const finalY = (doc.lastAutoTable?.finalY || 85) + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL (USD): $${totalPrice.toLocaleString()}`, 150, finalY);

    // Pretty Footer with Company Data
    const footerY = 245;
    doc.setDrawColor(125, 206, 209);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 5, 200, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS Y CONDICIONES', 15, footerY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('VALIDEZ: 15 Días calendarios.', 15, footerY + 5);
    doc.text('DIRECCIÓN: Garcilaso de la vega 1345 / 3A 106, Lima.', 15, footerY + 10);
    doc.text('TELÉFONO: (+51) 934 686 341 / 968 246 871 | EMAIL: ventas@plotterpedia.com', 15, footerY + 15);
    doc.text('CUENTAS: BCP (Soles): 191-0000000-0-00 | Interbank (USD): 200-0000000-0-00', 15, footerY + 20);
    doc.text('* A nombre de corporación Plotterpedia / Mente Grafik SAC.', 15, footerY + 25);

    doc.save(`Cotizacion_${clientInfo.name || 'Cliente'}.pdf`);
    setShowPreview(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header glass-effect">
        <div className="logo">PLOTTERPEDIA</div>
        <nav className="nav-links">
          <span 
            className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Catálogo
          </span>
          <span 
            className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventario
          </span>
        </nav>
        <div className="nav-actions">
          <button className="btn btn-outline" onClick={() => setIsQuoteOpen(true)} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <ShoppingCart size={20} />
            Cotización ({quoteItems.length})
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'catalog' && (
          <div className="animate-fade">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h1>Catálogo de Productos</h1>
              <div style={{position: 'relative', width: '300px'}}>
                <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666'}} />
                <input 
                  type="text" 
                  placeholder="Buscar cabezales, repuestos..." 
                  className="glass-effect"
                  style={{width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', background: 'rgba(255,255,255,0.05)'}}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="product-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card glass-effect">
                  <img src={product.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name} className="product-image" />
                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <div className="product-price">
                      {product.price > 0 ? `$${product.price.toLocaleString()}` : 'Consultar'}
                    </div>
                    <div style={{marginBottom: '1rem', fontSize: '0.8rem', color: product.stock > 0 ? 'var(--primary)' : '#ff4444'}}>
                      {product.stock > 0 ? `Stock disponible: ${product.stock} unid.` : 'Sin stock disponible'}
                    </div>
                    <button className="btn btn-primary" style={{width: '100%'}} onClick={() => addToQuote(product)}>
                      Añadir a Cotización
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="animate-fade">
            <div style={{maxWidth: '900px', margin: '0 auto'}}>
              <h1>Gestión de Inventario</h1>
              
              <form onSubmit={saveProduct} className="inventory-form glass-effect" style={{marginBottom: '3rem', marginTop: '1.5rem', border: editingProduct ? '2px solid var(--primary)' : '1px solid var(--glass-border)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3>{editingProduct ? 'Editando Producto' : 'Añadir Nuevo Producto'}</h3>
                  {editingProduct && (
                    <button type="button" className="btn btn-outline" onClick={() => {
                      setEditingProduct(null);
                      setNewProduct({ name: '', price: '', category: 'Repuestos', image: '' });
                    }} style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}>
                      Cancelar
                    </button>
                  )}
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem'}}>
                  <div className="form-group">
                    <label>Nombre del Producto</label>
                    <input 
                      required
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Ej. Cabezal Epson I3200"
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio ($USD)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option>Cabezales</option>
                      <option>Repuestos</option>
                      <option>Accesorios</option>
                      <option>Sistemas de Curado</option>
                      <option>Tintas</option>
                      <option>Maquinaria</option>
                      <option>Electrónica</option>
                      <option>Bombas</option>
                      <option>Soportes</option>
                      <option>Cables</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>URL Imagen</label>
                    <input 
                      value={newProduct.image}
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock / Cantidad</label>
                    <input 
                      type="number"
                      value={newProduct.stock}
                      onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>
                  {editingProduct ? 'Actualizar Producto' : 'Guardar en Inventario'}
                </button>
              </form>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', marginBottom: '1.5rem'}}>
                <h3>Lista de Inventario ({products.length} items)</h3>
                <div style={{position: 'relative', width: '250px'}}>
                  <Search size={16} style={{position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666'}} />
                  <input 
                    type="text" 
                    placeholder="Filtrar inventario..." 
                    className="glass-effect"
                    style={{width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem'}}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="glass-effect" style={{borderRadius: '16px', overflow: 'hidden'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                  <thead>
                    <tr style={{background: 'rgba(255,255,255,0.05)'}}>
                      <th style={{padding: '1rem'}}>Producto</th>
                      <th style={{padding: '1rem'}}>Categoría</th>
                      <th style={{padding: '1rem'}}>Precio</th>
                      <th style={{padding: '1rem'}}>Stock</th>
                      <th style={{padding: '1rem'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)', background: editingProduct?.id === p.id ? 'rgba(93, 193, 185, 0.1)' : 'transparent'}}>
                        <td style={{padding: '1rem'}}>{p.name}</td>
                        <td style={{padding: '1rem'}}><span className="product-category" style={{fontSize: '0.7rem'}}>{p.category}</span></td>
                        <td style={{padding: '1rem'}}>${p.price.toLocaleString()}</td>
                        <td style={{padding: '1rem'}}>
                          <span style={{
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            background: p.stock > 0 ? 'rgba(93, 193, 185, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                            color: p.stock > 0 ? 'var(--primary)' : '#ff4444',
                            fontSize: '0.85rem'
                          }}>
                            {p.stock || 0} unid.
                          </span>
                        </td>
                        <td style={{padding: '1rem'}}>
                          <div style={{display: 'flex', gap: '15px'}}>
                            <button onClick={() => startEdit(p)} title="Editar" style={{background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer'}}>
                              <FileText size={18} />
                            </button>
                            <button onClick={() => deleteProduct(p.id)} title="Borrar" style={{background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer'}}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quote Sidebar */}
      <div className={`quote-panel glass-effect ${isQuoteOpen ? 'open' : ''}`}>
        <div className="quote-header">
          <h2>Mi Cotización</h2>
          <button onClick={() => setIsQuoteOpen(false)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
            <X size={24} />
          </button>
        </div>

        {quoteItems.length === 0 ? (
          <div style={{textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)'}}>
            <ShoppingCart size={48} style={{opacity: 0.2, marginBottom: '1rem'}} />
            <p>La cotización está vacía</p>
          </div>
        ) : (
          <>
            <div className="quote-items">
              {quoteItems.map(item => (
                <div key={item.id} className="quote-item">
                  <div>
                    <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{item.name}</div>
                    <div style={{fontSize: '0.8rem', color: '#888'}}>Cant: {item.qty}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontWeight: 700}}>${(item.price * item.qty).toLocaleString()}</div>
                    <button 
                      onClick={() => removeFromQuote(item.id)}
                      style={{background: 'none', border: 'none', color: '#ff4444', fontSize: '0.7rem', cursor: 'pointer', padding: 0}}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="quote-total">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <span>Subtotal</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.2rem'}}>
                <span>TOTAL (USD)</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
            <button 
                className="btn btn-primary" 
                style={{width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}
                onClick={() => setShowPreview(true)}
              >
                <FileText size={20} />
                Previsualizar y Generar
              </button>
              <button className="btn btn-outline" style={{width: '100%'}} onClick={() => setQuoteItems([])}>
                Limpiar todo
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect animate-fade">
            <div className="quote-header">
              <h2>Vista Previa de Cotización</h2>
              <button onClick={() => setShowPreview(false)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* Form Section */}
              <div className="client-form" style={{padding: 0}}>
                <h3 style={{marginBottom: '1.5rem', color: 'var(--primary)'}}>Datos del Destinatario</h3>
                <div style={{display: 'grid', gap: '1.2rem'}}>
                  <div className="form-group">
                    <label>Nombre / Razón Social</label>
                    <input 
                      value={clientInfo.name}
                      onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                      placeholder="Ej. Juan Perez"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input 
                      value={clientInfo.phone}
                      onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                      placeholder="999 999 999"
                    />
                  </div>
                  <div className="form-group">
                    <label>DNI / RUC</label>
                    <input 
                      value={clientInfo.ruc}
                      onChange={e => setClientInfo({...clientInfo, ruc: e.target.value})}
                      placeholder="10..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Dirección</label>
                    <input 
                      value={clientInfo.address}
                      onChange={e => setClientInfo({...clientInfo, address: e.target.value})}
                      placeholder="Av. Siempre Viva 123"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Section (Visual Preview) */}
              <div className="preview-paper" style={{
                background: 'white', 
                color: '#333', 
                padding: '2.5rem', 
                borderRadius: '4px', 
                boxShadow: '0 4px 25px rgba(0,0,0,0.4)',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                {/* Header in Preview */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid var(--primary)'
                }}>
                  <div style={{width: '150px'}}>
                    <img src="/logo.png" alt="Logo" style={{width: '100%', height: 'auto'}} onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }} />
                    <h2 style={{display: 'none', color: 'var(--primary)', margin: 0}}>PLOTTERPEDIA</h2>
                  </div>
                  <div style={{textAlign: 'right', fontSize: '0.8rem', color: '#666'}}>
                    <div style={{fontWeight: 900, color: '#333', fontSize: '1rem', marginBottom: '0.3rem'}}>COTIZACIÓN</div>
                    <div>N°: CP-{Math.floor(1000 + Math.random() * 9000)}</div>
                    <div>Fecha: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{marginBottom: '2rem', fontSize: '0.8rem'}}>
                  <div style={{fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.3rem'}}>DIRIGIDO A:</div>
                  <div>{clientInfo.name || '---'}</div>
                  <div>{clientInfo.phone || '---'}</div>
                  <div>{clientInfo.ruc || '---'}</div>
                  <div>{clientInfo.address || '---'}</div>
                </div>

                <div style={{flex: 1}}>
                  <table style={{width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{borderBottom: '2px solid #eee', textAlign: 'left'}}>
                        <th style={{padding: '0.5rem 0'}}>ITEM</th>
                        <th style={{padding: '0.5rem 0', textAlign: 'center'}}>CANT.</th>
                        <th style={{padding: '0.5rem 0', textAlign: 'right'}}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map(item => (
                        <tr key={item.id} style={{borderBottom: '1px solid #f9f9f9'}}>
                          <td style={{padding: '0.5rem 0'}}>{item.name}</td>
                          <td style={{padding: '0.5rem 0', textAlign: 'center'}}>{item.qty}</td>
                          <td style={{padding: '0.5rem 0', textAlign: 'right'}}>${(item.price * item.qty).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{borderTop: '2px solid #eee', marginTop: '1rem', paddingTop: '1rem', textAlign: 'right'}}>
                  <div style={{fontSize: '1.1rem', fontWeight: 700}}>
                    TOTAL: ${totalPrice.toLocaleString()} USD
                  </div>
                </div>

                {/* Footer in Preview */}
                <div style={{marginTop: 'auto', paddingTop: '1rem', fontSize: '0.65rem', color: '#888', borderTop: '1px solid #f0f0f0'}}>
                  <div style={{fontWeight: 700, color: 'var(--primary)', marginBottom: '0.3rem'}}>PLOTTERPEDIA / MENTE GRAFIC SAC</div>
                  <div>📍 Garcilaso de la vega 1345 / 3A 106, Lima.</div>
                  <div>📞 (+51) 934 686 341 / 968 246 871 | ✉️ ventas@plotterpedia.com</div>
                  <div>💳 BCP (S): 191-0000000-0-00 | Interbank ($): 200-0000000-0-00</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPreview(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={generatePDF}>Confirmar y Generar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
