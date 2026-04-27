import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, Trash2, Search, X, FileText, ChevronRight } from 'lucide-react';
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
    image: ''
  });
  
  const [editingProduct, setEditingProduct] = useState(null);

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
        price: parseFloat(newProduct.price) || 0 
      } : p));
      setEditingProduct(null);
    } else {
      const product = {
        ...newProduct,
        id: Date.now(),
        price: parseFloat(newProduct.price) || 0
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
      image: product.image
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const totalPrice = quoteItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

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
              <button className="btn btn-primary" style={{width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                <FileText size={20} />
                Generar PDF
              </button>
              <button className="btn btn-outline" style={{width: '100%'}} onClick={() => setQuoteItems([])}>
                Limpiar todo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
