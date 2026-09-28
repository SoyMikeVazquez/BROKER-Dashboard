"use client";
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  Check, 
  Maximize2, 
  BedDouble, 
  Bath, 
  Car, 
  DollarSign, 
  Image as ImageIcon,
  Video,
  FileText,
  Shield,
  Layers,
  Heart,
  ExternalLink,
  ChevronRight,
  Info,
  Upload,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Propiedad {
  id: string;
  titulo: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  tipo: string;
  habitaciones: number | null;
  banos: number | null;
  metros_cuadrados: number | null;
  ubicacion: string;
  imagen_url: string | null;
  estatus: string;
  created_at: string;
  gestor_id: string | null;
  destacado: boolean;
  garage: boolean;
  piscina: boolean;
  
  // Columns from detailed specs
  calle: string | null;
  numero: string | null;
  colonia: string | null;
  delegacion_municipio: string | null;
  codigo_postal: string | null;
  tipo_operacion: string | null; // 'Venta' or 'Renta'
  metros_terreno: number | null;
  metros_construccion: number | null;
  medios_banos: number | null;
  estacionamientos: number | null;
  alberca: boolean;
  terraza: boolean;
  elevador: boolean;
  bodega: boolean;
  cuarto_servicio: boolean;
  security: boolean; // seguridad mapped locally or to database
  seguridad: boolean;
  estatus_legal: string | null;
  cuota_mantenimiento: number | null;
  detalles_mantenimiento: string | null;
  imagenes: string[] | null;
  video_url: string | null;
  tour_virtual_url: string | null;
  plano_arquitectonico_url: string | null;
}

const PREMIUM_HOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=600',
];

export default function PropiedadesTab() {
  const [properties, setProperties] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected property preview state
  const [previewProperty, setPreviewProperty] = useState<Propiedad | null>(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTab, setFormTab] = useState<'general' | 'ubicacion' | 'caracteristicas' | 'amenidades'>('general');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Image upload progress states
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Form Field States
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Casa');
  const [tipoOperacion, setTipoOperacion] = useState('Venta');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('MXN');
  
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [colonia, setColonia] = useState('');
  const [delegacionMunicipio, setDelegacionMunicipio] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [ciudadEstado, setCiudadEstado] = useState('Querétaro, Qro');

  const [metrosTerreno, setMetrosTerreno] = useState('');
  const [metrosConstruccion, setMetrosConstruccion] = useState('');
  const [habitaciones, setHabitaciones] = useState('3');
  const [banos, setBanos] = useState('2');
  const [mediosBanos, setMediosBanos] = useState('0');
  const [estacionamientos, setEstacionamientos] = useState('2');
  const [estatusLegal, setEstatusLegal] = useState('Libre de gravamen');

  const [alberca, setAlberca] = useState(false);
  const [terraza, setTerraza] = useState(false);
  const [elevador, setElevador] = useState(false);
  const [bodega, setBodega] = useState(false);
  const [cuartoServicio, setCuartoServicio] = useState(false);
  const [seguridad, setSeguridad] = useState(false);
  const [cuotaMantenimiento, setCuotaMantenimiento] = useState('');
  const [detallesMantenimiento, setDetallesMantenimiento] = useState('');

  const [mainImagenUrl, setMainImagenUrl] = useState('');
  const [imagenUrl2, setImagenUrl2] = useState('');
  const [imagenUrl3, setImagenUrl3] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tourVirtualUrl, setTourVirtualUrl] = useState('');
  const [planoArquitectonicoUrl, setPlanoArquitectonicoUrl] = useState('');

  // Mock fallbacks if database fetch yields zero records
  const MOCK_PROPERTIES: Propiedad[] = [
    { 
      id: '3bd128d7-256d-446b-b3f2-c81af233681c', 
      titulo: 'Casa Moderna con Alberca en Zibatá', 
      descripcion: 'Hermosa residencia moderna de tres niveles frente al campo de golf. Cuenta con amplios espacios, acabados de lujo, cocina equipada con granito, alberca templada propia, roof garden y estacionamiento techado.', 
      precio: 6850000, 
      moneda: 'MXN', 
      tipo: 'Casa', 
      habitaciones: 3, 
      banos: 3, 
      metros_cuadrados: 260, 
      ubicacion: 'Zibatá, Querétaro', 
      imagen_url: PREMIUM_HOUSE_IMAGES[0], 
      estatus: 'Disponible', 
      created_at: new Date().toISOString(),
      gestor_id: null,
      destacado: true,
      garage: true,
      piscina: true,
      
      calle: 'Av. Paseo de las Ciencias',
      numero: '450',
      colonia: 'Zibatá',
      delegacion_municipio: 'El Marqués',
      codigo_postal: '76230',
      tipo_operacion: 'Venta',
      metros_terreno: 300,
      metros_construccion: 260,
      medios_banos: 1,
      estacionamientos: 2,
      alberca: true,
      terraza: true,
      elevador: false,
      bodega: true,
      cuarto_servicio: true,
      security: true,
      seguridad: true,
      estatus_legal: 'Libre de gravamen, acepta créditos',
      cuota_mantenimiento: 1500,
      detalles_mantenimiento: 'Incluye vigilancia 24/7 y mantenimiento del fraccionamiento',
      imagenes: [PREMIUM_HOUSE_IMAGES[0], PREMIUM_HOUSE_IMAGES[1]],
      video_url: 'https://youtube.com/watch?v=mock',
      tour_virtual_url: 'https://my.matterport.com/show/?m=mock',
      plano_arquitectonico_url: ''
    },
    { 
      id: '2', 
      titulo: 'Penthouse de Lujo en Residencial Polanco', 
      descripcion: 'Penthouse espectacular de dos niveles en el corazón de Polanco. Elevador directo al departamento, terraza privada de 60m², acabados de mármol y madera de ingeniería. Seguridad privada armada, bodega y cuarto de servicio.', 
      precio: 24500000, 
      moneda: 'MXN', 
      tipo: 'Departamento', 
      habitaciones: 3, 
      banos: 3, 
      metros_cuadrados: 310, 
      ubicacion: 'Polanco, CDMX', 
      imagen_url: PREMIUM_HOUSE_IMAGES[1], 
      estatus: 'Disponible', 
      created_at: new Date().toISOString(),
      gestor_id: null,
      destacado: true,
      garage: true,
      piscina: false,
      
      calle: 'Campos Elíseos',
      numero: '120',
      colonia: 'Polanco V Sección',
      delegacion_municipio: 'Miguel Hidalgo',
      codigo_postal: '11560',
      tipo_operacion: 'Venta',
      metros_terreno: 0,
      metros_construccion: 310,
      medios_banos: 1,
      estacionamientos: 3,
      alberca: false,
      terraza: true,
      elevador: true,
      bodega: true,
      cuarto_servicio: true,
      security: true,
      seguridad: true,
      estatus_legal: 'Libre de gravamen',
      cuota_mantenimiento: 4500,
      detalles_mantenimiento: 'Vigilancia extrema, valet parking e iluminación exterior',
      imagenes: [PREMIUM_HOUSE_IMAGES[1]],
      video_url: '',
      tour_virtual_url: '',
      plano_arquitectonico_url: ''
    },
    { 
      id: '3', 
      titulo: 'Departamento Loft Amueblado en Renta Roma Norte', 
      descripcion: 'Hermoso loft estilo industrial 100% amueblado y equipado en el corazón de la Roma Norte. Ideal para ejecutivos o parejas. Balcón exterior, excelente iluminación natural, zona súper caminable.', 
      precio: 35000, 
      moneda: 'MXN', 
      tipo: 'Departamento', 
      habitaciones: 1, 
      banos: 1, 
      metros_cuadrados: 75, 
      ubicacion: 'Roma Norte, CDMX', 
      imagen_url: PREMIUM_HOUSE_IMAGES[2], 
      estatus: 'Disponible', 
      created_at: new Date().toISOString(),
      gestor_id: null,
      destacado: false,
      garage: false,
      piscina: false,
      
      calle: 'Colima',
      numero: '234',
      colonia: 'Roma Norte',
      delegacion_municipio: 'Cuauhtémoc',
      codigo_postal: '06700',
      tipo_operacion: 'Renta',
      metros_terreno: 0,
      metros_construccion: 75,
      medios_banos: 0,
      estacionamientos: 1,
      alberca: false,
      terraza: false,
      elevador: true,
      bodega: false,
      cuarto_servicio: false,
      security: true,
      seguridad: true,
      estatus_legal: 'Acepta póliza jurídica',
      cuota_mantenimiento: 1800,
      detalles_mantenimiento: 'Mantenimiento incluido en la renta',
      imagenes: [PREMIUM_HOUSE_IMAGES[2]],
      video_url: '',
      tour_virtual_url: '',
      plano_arquitectonico_url: ''
    }
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('propiedades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setProperties(data);
      } else {
        setProperties(MOCK_PROPERTIES);
      }
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setProperties(MOCK_PROPERTIES);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Logic to general bucket
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `propiedades/${fileName}`;

    try {
      setUploadingIndex(imageIndex);
      setErrorMsg(null);

      // Upload file to the 'general' bucket
      const { data, error } = await supabase.storage
        .from('general')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('general')
        .getPublicUrl(filePath);

      // Map to proper image variable
      if (imageIndex === 1) setMainImagenUrl(publicUrl);
      else if (imageIndex === 2) setImagenUrl2(publicUrl);
      else if (imageIndex === 3) setImagenUrl3(publicUrl);

    } catch (err: any) {
      console.error('Error uploading image:', err);
      setErrorMsg(`Error al subir imagen: ${err.message || 'Verifica que el bucket público "general" esté creado en tu consola de Supabase.'}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  // Keyboard navigation blocker to prevent auto-submitting on Enter key inside inputs
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Do not block Enter in submit button, links, or textareas
      if (target instanceof HTMLInputElement && target.type !== 'submit') {
        e.preventDefault(); // Stop form submission
        
        // Enhance UX by switching tabs instead of doing nothing
        if (formTab === 'general') {
          if (titulo && precio) setFormTab('ubicacion');
          else setErrorMsg('Por favor completa el Título y el Precio para avanzar.');
        } else if (formTab === 'ubicacion') {
          if (colonia && ciudadEstado) setFormTab('caracteristicas');
          else setErrorMsg('Por favor completa la Colonia y la Ciudad/Estado para avanzar.');
        } else if (formTab === 'caracteristicas') {
          setFormTab('amenidades');
        }
      }
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Validations
    if (!titulo || !precio || !colonia || !ciudadEstado) {
      setErrorMsg('Por favor completa los campos principales (Título, Precio, Colonia y Ciudad/Estado).');
      return;
    }

    setSaving(true);
    const numericPrice = parseFloat(precio);
    const numMetrosConst = parseFloat(metrosConstruccion) || 0;
    const numMetrosTerreno = parseFloat(metrosTerreno) || 0;
    const numHab = parseInt(habitaciones, 10) || 0;
    const numBanos = parseInt(banos, 10) || 0;
    const numMediosBanos = parseInt(mediosBanos, 10) || 0;
    const numEstac = parseInt(estacionamientos, 10) || 0;
    const numMant = parseFloat(cuotaMantenimiento) || 0;

    const visualImages = [
      mainImagenUrl || PREMIUM_HOUSE_IMAGES[Math.floor(Math.random() * PREMIUM_HOUSE_IMAGES.length)],
      ...(imagenUrl2 ? [imagenUrl2] : []),
      ...(imagenUrl3 ? [imagenUrl3] : [])
    ];

    try {
      const newProperty = {
        titulo,
        descripcion: descripcion || null,
        precio: numericPrice,
        moneda,
        tipo,
        tipo_operacion: tipoOperacion,
        habitaciones: numHab,
        banos: numBanos,
        metros_cuadrados: numMetrosConst, // maps to construction size by default
        ubicacion: `${colonia}, ${ciudadEstado}`,
        imagen_url: visualImages[0],
        estatus: 'Disponible',
        
        // Detailed specifications columns
        calle: calle || null,
        numero: numero || null,
        colonia: colonia || null,
        delegacion_municipio: delegacionMunicipio || null,
        codigo_postal: codigoPostal || null,
        metros_terreno: numMetrosTerreno || null,
        metros_construccion: numMetrosConst || null,
        medios_banos: numMediosBanos,
        estacionamientos: numEstac,
        alberca,
        terraza,
        elevador,
        bodega,
        cuarto_servicio: cuartoServicio,
        seguridad,
        estatus_legal: estatusLegal || null,
        cuota_mantenimiento: numMant,
        detalles_mantenimiento: detallesMantenimiento || null,
        imagenes: visualImages,
        video_url: videoUrl || null,
        tour_virtual_url: tourVirtualUrl || null,
        plano_arquitectonico_url: planoArquitectonicoUrl || null
      };

      const { error } = await supabase
        .from('propiedades')
        .insert([newProperty]);

      if (error) throw error;

      // Reset
      resetForm();
      setIsModalOpen(false);
      fetchProperties();
    } catch (err: any) {
      console.error('Error inserting property:', err);
      // Client-side testing fallback: create a local item so they can play with the UI
      const localNewItem: Propiedad = {
        id: Math.random().toString(),
        titulo,
        descripcion: descripcion || null,
        precio: numericPrice,
        moneda,
        tipo,
        tipo_operacion: tipoOperacion,
        habitaciones: numHab,
        banos: numBanos,
        metros_cuadrados: numMetrosConst,
        ubicacion: `${colonia}, ${ciudadEstado}`,
        imagen_url: visualImages[0],
        estatus: 'Disponible',
        created_at: new Date().toISOString(),
        gestor_id: null,
        destacado: false,
        garage: numEstac > 0,
        piscina: alberca,
        
        calle: calle || null,
        numero: numero || null,
        colonia: colonia || null,
        delegacion_municipio: delegacionMunicipio || null,
        codigo_postal: codigoPostal || null,
        metros_terreno: numMetrosTerreno || null,
        metros_construccion: numMetrosConst || null,
        medios_banos: numMediosBanos,
        estacionamientos: numEstac,
        alberca,
        terraza,
        elevador,
        bodega,
        cuarto_servicio: cuartoServicio,
        security: seguridad,
        seguridad,
        estatus_legal: estatusLegal || null,
        cuota_mantenimiento: numMant,
        detalles_mantenimiento: detallesMantenimiento || null,
        imagenes: visualImages,
        video_url: videoUrl || null,
        tour_virtual_url: tourVirtualUrl || null,
        plano_arquitectonico_url: planoArquitectonicoUrl || null
      };
      setProperties(prev => [localNewItem, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setTipo('Casa');
    setTipoOperacion('Venta');
    setPrecio('');
    setMoneda('MXN');
    setCalle('');
    setNumero('');
    setColonia('');
    setDelegacionMunicipio('');
    setCodigoPostal('');
    setMetrosTerreno('');
    setMetrosConstruccion('');
    setHabitaciones('3');
    setBanos('2');
    setMediosBanos('0');
    setEstacionamientos('2');
    setEstatusLegal('Libre de gravamen');
    setAlberca(false);
    setTerraza(false);
    setElevador(false);
    setBodega(false);
    setCuartoServicio(false);
    setSeguridad(false);
    setCuotaMantenimiento('');
    setDetallesMantenimiento('');
    setMainImagenUrl('');
    setImagenUrl2('');
    setImagenUrl3('');
    setVideoUrl('');
    setTourVirtualUrl('');
    setPlanoArquitectonicoUrl('');
    setFormTab('general');
  };

  const handleDeleteProperty = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering preview modal
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) return;

    try {
      await supabase
        .from('propiedades')
        .delete()
        .eq('id', id);

      setProperties(properties.filter(p => p.id !== id));
      if (previewProperty?.id === id) setPreviewProperty(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ubicacion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tipo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade">
      
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Mis propiedades</h1>
          <p className="page-subtitle">Base de datos conectada. Sube y edita fichas técnicas completas con planos y multimedia.</p>
        </div>
        <button 
          className="btn-primary-light"
          onClick={() => { resetForm(); setIsModalOpen(true); }}
        >
          <Plus size={18} />
          <span>Nueva propiedad</span>
        </button>
      </header>

      {/* Toolbar Controls */}
      <div className="toolbar-controls">
        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input 
            type="text" 
            className="search-input-field" 
            placeholder="Buscar por título, ubicación o tipo de inmueble..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Property Cards */}
      {loading && properties.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando catálogo inmobiliario...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="section-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h4>No se encontraron propiedades</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Modifica los términos de búsqueda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredProperties.map((prop, idx) => {
            const displayImg = prop.imagen_url || PREMIUM_HOUSE_IMAGES[idx % PREMIUM_HOUSE_IMAGES.length];
            const isRenta = prop.tipo_operacion === 'Renta';
            
            return (
              <div 
                key={prop.id} 
                className="section-panel"
                onClick={() => setPreviewProperty(prop)}
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {/* Visual Header */}
                <div style={{ height: '190px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={displayImg} 
                    alt={prop.titulo} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                    className="card-image-zoom"
                  />
                  
                  {/* Operation Tag (Venta / Renta) */}
                  <span style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '12px', 
                    padding: '0.35rem 0.65rem', 
                    background: isRenta ? '#7c3aed' : '#000000', 
                    color: '#ffffff', 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {prop.tipo_operacion || 'Venta'}
                  </span>

                  {/* Status Badge */}
                  <span style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    padding: '0.35rem 0.65rem', 
                    background: 'rgba(255,255,255,0.9)', 
                    color: 'var(--text-main)', 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    borderRadius: '4px',
                    backdropFilter: 'blur(4px)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {prop.estatus || 'Disponible'}
                  </span>
                </div>

                {/* Card Content Details */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {prop.tipo}
                  </span>
                  
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: '1.4', minHeight: '2.8rem' }}>
                    {prop.titulo}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.ubicacion}</span>
                  </div>

                  {/* Physical spec items line */}
                  <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '0.5rem 0', margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Maximize2 size={13} color="var(--text-muted)" />
                      <span>{prop.metros_construccion || prop.metros_cuadrados || 0} m²</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BedDouble size={13} color="var(--text-muted)" />
                      <span>{prop.habitaciones || 0} Rec.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Bath size={13} color="var(--text-muted)" />
                      <span>{prop.banos || 0} {prop.medios_banos ? `.5` : ''} B.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Car size={13} color="var(--text-muted)" />
                      <span>{prop.estacionamientos || 0} E.</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>$</span>
                      <span>{prop.precio.toLocaleString('es-MX')}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.25rem' }}>
                        {prop.moneda || 'MXN'}
                        {isRenta && '/mes'}
                      </span>
                    </div>
                    
                    {/* Delete item */}
                    <button 
                      type="button"
                      className="icon-button" 
                      style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', height: '28px', width: '28px' }}
                      onClick={(e) => handleDeleteProperty(prop.id, e)}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Add Property Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Subir Nueva Ficha de Propiedad</h3>
              <button 
                type="button"
                className="modal-close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            {/* Modal Tabs Selector */}
            <div style={{ display: 'flex', background: 'var(--background)', borderBottom: '1px solid var(--border)', padding: '0.5rem 1rem' }}>
              {(['general', 'ubicacion', 'caracteristicas', 'amenidades'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFormTab(tab)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: formTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: formTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'var(--transition)'
                  }}
                >
                  {tab === 'general' && '1. General'}
                  {tab === 'ubicacion' && '2. Ubicación'}
                  {tab === 'caracteristicas' && '3. Características'}
                  {tab === 'amenidades' && '4. Amenidades & Media'}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateProperty} onKeyDown={handleFormKeyDown}>
              <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '55vh' }}>
                {errorMsg && (
                  <div className="error-alert" style={{ marginBottom: '1.25rem' }}>
                    <AlertTriangle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Tab 1: General Info */}
                {formTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="input-label-light">Título del Anuncio (Obligatorio)</label>
                      <input 
                        type="text" 
                        className="form-input-light" 
                        placeholder="Casa Residencial con Alberca y Roof Garden"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="input-label-light">Descripción Detallada</label>
                      <textarea 
                        className="form-input-light" 
                        placeholder="Describe los acabados, distribución, iluminación y detalles atractivos..."
                        rows={4}
                        style={{ resize: 'none', fontFamily: 'inherit' }}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="input-label-light">Tipo de Inmueble</label>
                        <select className="form-select-light" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                          <option value="Casa">Casa</option>
                          <option value="Departamento">Departamento</option>
                          <option value="Oficina">Oficina</option>
                          <option value="Local Comercial">Local Comercial</option>
                          <option value="Terreno">Terreno</option>
                          <option value="Bodega">Bodega</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="input-label-light">Tipo de Operación</label>
                        <select className="form-select-light" value={tipoOperacion} onChange={(e) => setTipoOperacion(e.target.value)}>
                          <option value="Venta">Venta</option>
                          <option value="Renta">Renta</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="input-label-light">Monto del Precio</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          placeholder="6500000"
                          value={precio}
                          onChange={(e) => setPrecio(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label-light">Moneda</label>
                        <select className="form-select-light" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                          <option value="MXN">Pesos Mexicanos (MXN)</option>
                          <option value="USD">Dólares (USD)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Location */}
                {formTab === 'ubicacion' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: 'span 1.5' }}>
                        <label className="input-label-light">Calle</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="Av. Paseo de las Lomas"
                          value={calle}
                          onChange={(e) => setCalle(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Número (Ext / Int)</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="123 - Int 4"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="input-label-light">Colonia (Obligatorio)</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="Lomas del Marqués"
                          value={colonia}
                          onChange={(e) => setColonia(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Delegación / Municipio</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="Querétaro"
                          value={delegacionMunicipio}
                          onChange={(e) => setDelegacionMunicipio(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="input-label-light">Código Postal</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="76000"
                          value={codigoPostal}
                          onChange={(e) => setCodigoPostal(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Ciudad, Estado (Obligatorio)</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="Querétaro, Qro"
                          value={ciudadEstado}
                          onChange={(e) => setCiudadEstado(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Specs */}
                {formTab === 'caracteristicas' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="input-label-light">Metros de Terreno (m²)</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          placeholder="250"
                          value={metrosTerreno}
                          onChange={(e) => setMetrosTerreno(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Metros de Construcción (m²)</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          placeholder="220"
                          value={metrosConstruccion}
                          onChange={(e) => setMetrosConstruccion(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label className="input-label-light">Recámaras</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          value={habitaciones}
                          onChange={(e) => setHabitaciones(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Baños Compl.</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          value={banos}
                          onChange={(e) => setBanos(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Medios Baños</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          value={mediosBanos}
                          onChange={(e) => setMediosBanos(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Estacionam.</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          value={estacionamientos}
                          onChange={(e) => setEstacionamientos(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="input-label-light">Estatus Legal de Propiedad</label>
                      <select className="form-select-light" value={estatusLegal} onChange={(e) => setEstatusLegal(e.target.value)}>
                        <option value="Libre de gravamen">Libre de gravamen</option>
                        <option value="Acepta créditos hipotecarios bancarios e Infonavit">Acepta créditos (Bancarios / Infonavit)</option>
                        <option value="Remate bancario / Solo pago de contado">Remate bancario (Solo contado)</option>
                        <option value="En proceso de escrituración">En proceso de escrituración</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Tab 4: Amenities, Storage Bucket Uploads & Media */}
                {formTab === 'amenidades' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Amenities Checkboxes */}
                    <div>
                      <label className="input-label-light" style={{ marginBottom: '0.5rem', display: 'block' }}>Amenidades y Seguridad</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={alberca} onChange={(e) => setAlberca(e.target.checked)} />
                          <span>Alberca / Piscina</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={terraza} onChange={(e) => setTerraza(e.target.checked)} />
                          <span>Terraza / Balcón</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={elevador} onChange={(e) => setElevador(e.target.checked)} />
                          <span>Elevador</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={bodega} onChange={(e) => setBodega(e.target.checked)} />
                          <span>Bodega</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={cuartoServicio} onChange={(e) => setCuartoServicio(e.target.checked)} />
                          <span>Cuarto de servicio</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={seguridad} onChange={(e) => setSeguridad(e.target.checked)} />
                          <span>Seguridad 24/7</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="input-label-light">Cuota de Mantenimiento ($)</label>
                        <input 
                          type="number" 
                          className="form-input-light" 
                          placeholder="1500"
                          value={cuotaMantenimiento}
                          onChange={(e) => setCuotaMantenimiento(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label-light">Detalles Mantenimiento</label>
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="Incluye vigilancia y poda..."
                          value={detallesMantenimiento}
                          onChange={(e) => setDetallesMantenimiento(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Supabase Storage Bucket Uploader Section */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <label className="input-label-light" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                        <Upload size={14} />
                        <span>Imágenes del Inmueble (Subida directa a bucket: general)</span>
                      </label>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        {/* Image 1: Main Photo */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
                          {uploadingIndex === 1 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <Loader2 size={20} className="animate-spin" color="var(--primary)" />
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Subiendo...</span>
                            </div>
                          ) : mainImagenUrl ? (
                            <>
                              <img src={mainImagenUrl} alt="Principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => setMainImagenUrl('')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                              <ImageIcon size={20} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Foto Principal</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 1)} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>

                        {/* Image 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
                          {uploadingIndex === 2 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <Loader2 size={20} className="animate-spin" color="var(--primary)" />
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Subiendo...</span>
                            </div>
                          ) : imagenUrl2 ? (
                            <>
                              <img src={imagenUrl2} alt="Secundaria 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => setImagenUrl2('')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                              <ImageIcon size={20} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Foto 2 (Opcional)</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 2)} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>

                        {/* Image 3 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
                          {uploadingIndex === 3 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <Loader2 size={20} className="animate-spin" color="var(--primary)" />
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Subiendo...</span>
                            </div>
                          ) : imagenUrl3 ? (
                            <>
                              <img src={imagenUrl3} alt="Secundaria 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => setImagenUrl3('')} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                              <ImageIcon size={20} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Foto 3 (Opcional)</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 3)} style={{ display: 'none' }} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Video and tours URLs */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <label className="input-label-light" style={{ marginBottom: '0.5rem', display: 'block' }}>Enlaces e Integraciones Adicionales</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                          <Video size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            className="form-input-light" 
                            placeholder="URL Enlace de Video (YouTube/Vimeo)" 
                            style={{ paddingLeft: '2.25rem' }}
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <ExternalLink size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            className="form-input-light" 
                            placeholder="URL Recorrido Virtual Matterport" 
                            style={{ paddingLeft: '2.25rem' }}
                            value={tourVirtualUrl}
                            onChange={(e) => setTourVirtualUrl(e.target.value)}
                          />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <FileText size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            className="form-input-light" 
                            placeholder="URL Enlace Plano Arquitectónico" 
                            style={{ paddingLeft: '2.25rem' }}
                            value={planoArquitectonicoUrl}
                            onChange={(e) => setPlanoArquitectonicoUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Modal controls */}
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary-light"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                
                {formTab !== 'amenidades' ? (
                  <button 
                    type="button" 
                    className="btn-primary-light"
                    onClick={() => {
                      if (formTab === 'general') {
                        if (titulo && precio) setFormTab('ubicacion');
                        else setErrorMsg('Por favor completa el Título y el Precio para avanzar.');
                      } else if (formTab === 'ubicacion') {
                        if (colonia && ciudadEstado) setFormTab('caracteristicas');
                        else setErrorMsg('Por favor completa la Colonia y la Ciudad/Estado para avanzar.');
                      } else if (formTab === 'caracteristicas') {
                        setFormTab('amenidades');
                      }
                    }}
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn-primary-light"
                    disabled={saving || uploadingIndex !== null}
                  >
                    {saving ? 'Guardando...' : 'Guardar Propiedad'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Property Detail Sheet (Preview modal) */}
      {previewProperty && (
        <div className="modal-overlay" onClick={() => setPreviewProperty(null)}>
          <div className="modal-container" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  background: previewProperty.tipo_operacion === 'Renta' ? '#7c3aed' : '#000000', 
                  color: '#ffffff', 
                  fontSize: '0.65rem', 
                  fontWeight: 800, 
                  borderRadius: '20px' 
                }}>
                  {previewProperty.tipo_operacion || 'Venta'}
                </span>
                <h3 className="modal-title">{previewProperty.titulo}</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setPreviewProperty(null)}>&times;</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                
                {/* Visual Media Column */}
                <div>
                  <div style={{ width: '100%', height: '260px', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border)' }}>
                    <img 
                      src={previewProperty.imagen_url || PREMIUM_HOUSE_IMAGES[0]} 
                      alt={previewProperty.titulo} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Visual gallery links if available */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enlaces multimedia integrados</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {previewProperty.video_url ? (
                        <a href={previewProperty.video_url} target="_blank" rel="noreferrer" className="btn-secondary-light" style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                          <Video size={14} />
                          <span>Ver Video</span>
                        </a>
                      ) : (
                        <div style={{ opacity: 0.5, pointerEvents: 'none' }} className="btn-secondary-light">Sin Video</div>
                      )}
                      
                      {previewProperty.tour_virtual_url ? (
                        <a href={previewProperty.tour_virtual_url} target="_blank" rel="noreferrer" className="btn-secondary-light" style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                          <ExternalLink size={14} />
                          <span>Tour 3D Matterport</span>
                        </a>
                      ) : (
                        <div style={{ opacity: 0.5, pointerEvents: 'none' }} className="btn-secondary-light">Sin Tour Virtual</div>
                      )}

                      {previewProperty.plano_arquitectonico_url ? (
                        <a href={previewProperty.plano_arquitectonico_url} target="_blank" rel="noreferrer" className="btn-secondary-light" style={{ padding: '0.5rem', fontSize: '0.75rem', gridColumn: 'span 2' }}>
                          <FileText size={14} />
                          <span>Plano Arquitectónico</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Specs Specifications Details Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Price */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTO TOTAL</span>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                      <span>${previewProperty.precio.toLocaleString('es-MX')}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.35rem' }}>
                        {previewProperty.moneda || 'MXN'}
                        {previewProperty.tipo_operacion === 'Renta' && '/mes'}
                      </span>
                    </div>
                    {previewProperty.cuota_mantenimiento ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                        + ${previewProperty.cuota_mantenimiento.toLocaleString('es-MX')} MXN mantenimiento
                      </span>
                    ) : null}
                  </div>

                  {/* Location Info */}
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIRECCIÓN COMPLETA</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      <span>{previewProperty.calle || ''} {previewProperty.numero || ''}, Col. {previewProperty.colonia || ''}, {previewProperty.delegacion_municipio || ''}, C.P. {previewProperty.codigo_postal || ''}</span>
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ubicación comercial: {previewProperty.ubicacion}</span>
                  </div>

                  {/* Specs specs grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Construcción</span>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewProperty.metros_construccion || previewProperty.metros_cuadrados || 0} m²</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terreno</span>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewProperty.metros_terreno || 0} m²</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recámaras</span>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewProperty.habitaciones || 0} recámaras</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baños completos / medios</span>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewProperty.banos || 0} comp. / {previewProperty.medios_banos || 0} med.</p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estacionamientos</span>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewProperty.estacionamientos || 0} cajones</p>
                    </div>
                  </div>

                  {/* Legal Technical */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTATUS LEGAL</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {previewProperty.estatus_legal || 'Libre de gravamen'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Full Description */}
              {previewProperty.descripcion && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Descripción del Inmueble</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {previewProperty.descripcion}
                  </p>
                </div>
              )}

              {/* Amenities checkboxes labels checklist */}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Amenidades y Servicios Incluidos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Alberca / Piscina', val: previewProperty.alberca },
                    { label: 'Terraza / Balcón', val: previewProperty.terraza },
                    { label: 'Elevador', val: previewProperty.elevador },
                    { label: 'Bodega privada', val: previewProperty.bodega },
                    { label: 'Cuarto de servicio', val: previewProperty.cuarto_servicio },
                    { label: 'Seguridad 24/7', val: previewProperty.seguridad || previewProperty.security }
                  ].map((amen, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.45rem', 
                        fontSize: '0.85rem', 
                        color: amen.val ? 'var(--text-main)' : 'var(--text-muted)',
                        fontWeight: amen.val ? 600 : 400
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: amen.val ? 'var(--success-bg)' : 'var(--background)',
                        color: amen.val ? 'var(--success)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: amen.val ? 'var(--success)' : 'var(--border)'
                      }}>
                        {amen.val && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span>{amen.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                className="btn-primary-light" 
                onClick={() => setPreviewProperty(null)}
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
