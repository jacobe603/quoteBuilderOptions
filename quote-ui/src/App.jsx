import { useState, useCallback, useEffect, useMemo, useRef } from "react";

const gid = () => Math.random().toString(36).substr(2, 9);
const FLAT_GRID_COLS = "92px 58px 42px minmax(120px,1.1fr) minmax(140px,1.2fr) minmax(110px,1fr) minmax(96px,0.9fr) 76px 46px 46px 46px 62px 48px 88px 36px";
const moveItem = (arr, idx, dir) => {
  const n = idx + dir;
  if (n < 0 || n >= arr.length) return arr;
  const c = [...arr]; [c[idx], c[n]] = [c[n], c[idx]]; return c;
};

const CATEGORIES = ["Vent", "Heat", "Hydro", "TC", "Misc"];
const PKG_TYPES = ["Building", "Phase", "Alternate", "Custom"];
const STORAGE_KEY = "svl_quote_builder_v4";
const DEFAULT_MFR_OPTIONS = [
  "Aaon",
  "Titus",
  "Ruskin",
  "Cook",
  "Greenheck",
  "Nailor",
  "Price",
  "Vibro-Acoustics",
  "CDI - Curbs",
  "Check Test Startup",
  "Indeeco",
  "Carnes",
  "Metalaire",
  "PennBarry",
  "Temtrol",
  "Trane",
  "Daikin",
  "Carrier",
  "York",
  "Lennox",
];
const DEFAULT_EQUIPMENT_OPTIONS = [
  "Rooftop Units",
  "DOAS",
  "MAU",
  "Curbs",
  "Fans",
  "Sound Attenuators",
  "VAVs",
  "GRDs",
  "Electric Heaters",
  "Life Safety Dampers",
  "Humidifiers",
  "Energy Recovery Units",
  "Air Terminals",
  "Unit Heaters",
  "Louvers",
  "Controls",
  "Coils",
  "Terminal Boxes",
  "Dampers",
  "Misc",
];

const EMPTY_LINE = {
  id: "", role: "primary", groupId: "",
  qty: 1, manufacturer: "", equipment: "", model: "",
  list: 0, dollarUp: 0, multi: 1, pay: 0,
  freight: 0, mu: 1.35, notes: "", status: ".", category: "Vent",
  description: "", tag: "",
  isNote: false, noteText: "",
};

const calc = (l) => {
  if (l?.isNote) return { mfgNet: 0, mfgComm: 0, totalNet: 0, bidPrice: 0, comm: 0 };
  const mfgNet = l.list * (1 + l.dollarUp / 100) * l.multi;
  const mfgComm = mfgNet * (l.pay / 100);
  const totalNet = mfgNet + l.freight;
  const bidPrice = totalNet * l.mu;
  const comm = bidPrice - totalNet;
  return { mfgNet, mfgComm, totalNet, bidPrice, comm };
};

const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const fmtPct = (n) => (n * 100).toFixed(1) + "%";
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toCurrencyNum = (v) => {
  const cleaned = String(v ?? "").replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};
const cloneQuoteData = (value) => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};
const loadDraft = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data && Array.isArray(parsed.data.packages)) return parsed;
  } catch {
    return null;
  }
  return null;
};
const saveDraft = (data) => {
  if (typeof window === "undefined") return null;
  try {
    const stamp = Date.now();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: stamp, data }));
    return stamp;
  } catch {
    return null;
  }
};
const sumLines = (lines) => lines.reduce((a, l) => {
  const c = calc(l);
  return { mfgNet: a.mfgNet + c.mfgNet, mfgComm: a.mfgComm + c.mfgComm, totalNet: a.totalNet + c.totalNet, bidPrice: a.bidPrice + c.bidPrice, comm: a.comm + c.comm, freight: a.freight + (l?.isNote ? 0 : l.freight) };
}, { mfgNet: 0, mfgComm: 0, totalNet: 0, bidPrice: 0, comm: 0, freight: 0 });

function CurrencyInput({ value, onChange, style, placeholder }) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const numericValue = toNum(value);

  useEffect(() => {
    if (!isFocused) setDraft(fmt(numericValue));
  }, [numericValue, isFocused]);

  return (
    <input
      style={style}
      inputMode="decimal"
      value={isFocused ? draft : fmt(numericValue)}
      placeholder={placeholder}
      onFocus={() => {
        setIsFocused(true);
        setDraft(String(numericValue));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        onChange(toCurrencyNum(raw));
      }}
      onBlur={() => {
        const next = toCurrencyNum(draft);
        onChange(next);
        setIsFocused(false);
        setDraft(fmt(next));
      }}
    />
  );
}

function useSelection() {
  const [sel, setSel] = useState({ type: null, ids: [] });
  const toggle = useCallback((type, id) => {
    setSel(prev => {
      if (prev.type && prev.type !== type) return prev;
      const has = prev.ids.includes(id);
      const newIds = has ? prev.ids.filter(x => x !== id) : [...prev.ids, id];
      return { type: newIds.length > 0 ? type : null, ids: newIds };
    });
  }, []);
  const clear = useCallback(() => setSel({ type: null, ids: [] }), []);
  const isSelected = useCallback((id) => sel.ids.includes(id), [sel.ids]);
  const isDisabled = useCallback((type) => sel.type !== null && sel.type !== type, [sel.type]);
  return { sel, toggle, clear, isSelected, isDisabled };
}

const sampleData = () => {
  const g1=gid(),g2=gid(),g3=gid(),g4=gid(),g5=gid(),g6=gid(),g7=gid();
  return {
    projectName:"Project Skyway - Data Center Office Hub",location:"Pine Island, MN",
    bidDate:"2026-01-21",quoteNumber:"1182950",quoteName:"Vent Quote",
    addendums:"0",date:"2026-01-21",salesEngineer:"Tom McCarty",
    projectEngineer:"Gareth Nelson",engineer:"None - TAM",
    market:"Data Centers",phase:"Initial Bid",to:"Mechanical Contractors",
    packages:[
      {id:gid(),name:"Office Hub Space - Building 1",type:"Building",priceGroups:[
        {id:gid(),name:"DOAS Units and Make Up Air Unit",addDeducts:[],lineItems:[
          {id:gid(),role:"primary",groupId:g1,qty:3,manufacturer:"Aaon",equipment:"Rooftop Units",model:"DOAS",list:392296,dollarUp:0,multi:0.35,pay:0,freight:4000,mu:1.5,notes:"",status:".",category:"Vent",tag:"DOAS-1,2,4",description:"2\" R-13 double wall construction\n460/60/3 voltage\nVariable speed compressors\n6-row DX cooling coils\nAir source heat pump\nElectric preheat\nEnergy recovery wheels\nElectric post heat with SCR\nDirect drive plenum supply fan with VFD\nPhase & brownout protection\nMERV 8 and MERV 13 filters\nWattmaster VCC-X DOAS controls with BACnet IP\nPlenum curbs for horizontal discharge/return\nStart-up and first year labor by SVL Service"},
          {id:gid(),role:"primary",groupId:g2,qty:1,manufacturer:"Aaon",equipment:"Rooftop Units",model:"MAU",list:167690,dollarUp:0,multi:0.35,pay:0,freight:1000,mu:1.5,notes:"",status:".",category:"Vent",tag:"MAU-1",description:"100% OA with motorized intake damper\nAir source heat pump operation\nElectric heat with SCR control\nDirect drive plenum supply fan with VFD\nWattmaster VCC-X DOAS controls with BACnet IP\nRoof curb\nStart-up and first year labor by SVL Service"},
          {id:gid(),role:"supporting",groupId:g1,qty:4,manufacturer:"CDI - Curbs",equipment:"Curbs",model:"",list:22500,dollarUp:0,multi:1,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Vent",tag:"",description:""},
          {id:gid(),role:"supporting",groupId:g1,qty:4,manufacturer:"Check Test Startup",equipment:"CTS+1",model:"",list:17060,dollarUp:0,multi:1,pay:0,freight:0,mu:1.15,notes:"",status:".",category:"Misc",tag:"",description:""},
        ]},
        {id:gid(),name:"Sound Attenuators",lineItems:[
          {id:gid(),role:"primary",groupId:g3,qty:7,manufacturer:"Vibro-Acoustics",equipment:"Sound Attenuators",model:"",list:6600,dollarUp:10,multi:1,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Vent",tag:"SA-1-1 thru 3-2",description:"22ga casing, 22ga liner, and mylar film"},
        ],addDeducts:[
          {id:gid(),type:"DEDUCT",description:"DEDUCT TO REMOVE MYLAR FILM",lineItems:[
            {id:gid(),role:"primary",groupId:gid(),qty:7,manufacturer:"Vibro-Acoustics",equipment:"Sound Attenuators",model:"No Mylar",list:1268,dollarUp:0,multi:1,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Vent",tag:"",description:""},
          ]},
        ]},
        {id:gid(),name:"Fans",addDeducts:[],lineItems:[
          {id:gid(),role:"primary",groupId:g4,qty:7,manufacturer:"Cook",equipment:"Fans",model:"",list:21372,dollarUp:0,multi:0.38,pay:0,freight:459,mu:1.4,notes:"see 460V add in folder",status:".",category:"Vent",tag:"",description:""},
          {id:gid(),role:"supporting",groupId:g4,qty:2,manufacturer:"Cook",equipment:"Misc",model:"Paint",list:2000,dollarUp:0,multi:0.38,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Misc",tag:"",description:""},
          {id:gid(),role:"supporting",groupId:g4,qty:4,manufacturer:"CDI - Curbs",equipment:"Curbs",model:"",list:1000,dollarUp:0,multi:1,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Vent",tag:"",description:""},
        ]},
      ]},
      {id:gid(),name:"Office Space - Building 2",type:"Building",priceGroups:[
        {id:gid(),name:"GRDs and VAV Terminal Units",addDeducts:[],lineItems:[
          {id:gid(),role:"primary",groupId:g5,qty:236,manufacturer:"Titus",equipment:"GRDs",model:"",list:11742.94,dollarUp:6.5,multi:1,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Vent",tag:"",description:"Variety of models and sizes finished standard white."},
          {id:gid(),role:"primary",groupId:g6,qty:27,manufacturer:"Titus",equipment:"VAVs",model:"DESV",list:14430,dollarUp:6.5,multi:1,pay:0,freight:0,mu:1.4,notes:"",status:".",category:"Vent",tag:"",description:"Empty control enclosure, double wall, fused disconnect, SCR electric reheat coil."},
        ]},
        {id:gid(),name:"Electric Wall Heater",addDeducts:[],lineItems:[
          {id:gid(),role:"primary",groupId:g7,qty:1,manufacturer:"Indeeco",equipment:"Electric Heaters",model:"UHIR",list:952,dollarUp:0,multi:1,pay:0,freight:0,mu:1.35,notes:"",status:".",category:"Vent",tag:"EUH-129",description:"2.5kW @ 208/1/60 power, built in thermostat\nWall/Ceiling mounting bracket"},
        ]},
        {id:gid(),name:"Life Safety Dampers",addDeducts:[],lineItems:[
          {id:gid(),role:"primary",groupId:gid(),qty:2,manufacturer:"Ruskin",equipment:"Life Safety Dampers",model:"DIBD2",list:498.08,dollarUp:7,multi:1,pay:0,freight:0,mu:1.5,notes:"",status:".",category:"Vent",tag:"",description:"UL555 rated vertical curtain style, 1.5-hour rating, integral sleeves."},
        ]},
      ]},
    ],
  };
};

const emptyQuote = () => ({
  projectName:"",location:"",bidDate:"",quoteNumber:"",quoteName:"",
  addendums:"0",date:"",salesEngineer:"",projectEngineer:"",
  engineer:"",market:"",phase:"",to:"",
  packages:[{id:gid(),name:"Package 1",type:"Building",priceGroups:[
    {id:gid(),name:"New Price Group",addDeducts:[],lineItems:[
      {...EMPTY_LINE,id:gid(),groupId:gid()},
    ]},
  ]}],
});

const S = {
  app:{fontFamily:"'Segoe UI',system-ui,sans-serif",maxWidth:1500,margin:"0 auto",padding:"16px 20px",background:"#f3f4f6",minHeight:"100vh",fontSize:13},
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingBottom:12,borderBottom:"3px solid #0058A4"},
  title:{fontSize:22,fontWeight:800,color:"#0058A4"},
  utilBar:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",background:"#fff",border:"1px solid #ddd",borderRadius:6,padding:"10px 12px",marginBottom:12},
  utilLeft:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  utilRight:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  utilPill:(ok)=>({padding:"3px 8px",borderRadius:999,fontSize:11,fontWeight:700,background:ok?"#e8f5e9":"#fff3e0",color:ok?"#2e7d32":"#b26a00",border:`1px solid ${ok?"#a5d6a7":"#ffd27d"}`}),
  warnBox:{marginTop:8,padding:"8px 10px",borderRadius:5,background:"#fff8e1",border:"1px solid #ffd27d",fontSize:12,color:"#8d6300"},
  filterWrap:{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"},
  filterInput:{padding:"6px 8px",border:"1px solid #ccc",borderRadius:4,fontSize:12,minWidth:260},
  tabs:{display:"flex",gap:4,marginBottom:16},
  tab:(a)=>({padding:"8px 20px",cursor:"pointer",fontWeight:600,background:a?"#0058A4":"#fff",color:a?"#fff":"#555",border:a?"none":"1px solid #ccc",borderRadius:"6px 6px 0 0",fontSize:13}),
  card:{background:"#fff",borderRadius:6,padding:14,marginBottom:16,border:"1px solid #ddd"},
  row:{display:"flex",gap:10,flexWrap:"wrap",marginBottom:6},
  fld:(w)=>({display:"flex",flexDirection:"column",gap:1,width:w||"auto"}),
  lbl:{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:0.5},
  inp:{padding:"5px 7px",border:"1px solid #ccc",borderRadius:3,fontSize:13,width:"100%",boxSizing:"border-box"},
  inpSm:{padding:"2px 4px",border:"1px solid #ccc",borderRadius:3,fontSize:11,width:"100%",boxSizing:"border-box",textAlign:"right"},
  inpSmL:{padding:"2px 4px",border:"1px solid #ccc",borderRadius:3,fontSize:11,width:"100%",boxSizing:"border-box"},
  btn:(c="#0058A4",sz=13)=>({padding:`${sz>12?8:5}px ${sz>12?16:10}px`,background:c,color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontWeight:600,fontSize:sz,whiteSpace:"nowrap"}),
  btnO:(c="#0058A4")=>({padding:"4px 8px",background:"#fff",color:c,border:`1.5px solid ${c}`,borderRadius:4,cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap"}),
  pkg:{border:"2px solid #0058A4",borderRadius:8,marginBottom:20,overflow:"hidden"},
  pkgH:{background:"#0058A4",color:"#fff",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"},
  pkgHInp:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)",color:"#fff",padding:"5px 8px",borderRadius:4,fontWeight:700,fontSize:15},
  pkgHSel:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)",color:"#fff",padding:"4px 6px",borderRadius:4,fontSize:12},
  pgBlk:{border:"1px solid #ddd",borderRadius:6,margin:"8px 10px",overflow:"hidden"},
  pgH:{background:"#e9eef5",padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #ddd",gap:8,flexWrap:"wrap"},
  gridCols:"24px 64px 42px 100px 100px 88px 72px 78px 42px 46px 40px 80px 66px 54px 80px 44px 72px 86px 130px 86px 52px",
  lineHdr:{fontSize:9,fontWeight:700,color:"#777",textTransform:"uppercase",padding:"3px 3px",borderBottom:"2px solid #ccc",background:"#fafafa"},
  lineRow:(role,sel)=>({padding:"1px 3px",borderBottom:"1px solid #eee",background:sel?"#fff3e0":role==="supporting"?"#f7f9fc":"#fff",borderLeft:sel?"3px solid #E46B03":role==="supporting"?"3px solid #7bafd4":"3px solid transparent",alignItems:"center"}),
  calcCell:{fontSize:12,fontWeight:600,textAlign:"right",padding:"0 2px",color:"#333",overflow:"hidden"},
  calcCellBlue:{fontSize:12,fontWeight:700,textAlign:"right",padding:"0 2px",color:"#0058A4"},
  calcCellGreen:{fontSize:12,fontWeight:700,textAlign:"right",padding:"0 2px",color:"#2e7d32"},
  badge:(r)=>({display:"inline-block",padding:"1px 5px",borderRadius:3,fontSize:9,fontWeight:700,background:r==="primary"?"#0058A4":"#78909c",color:"#fff",cursor:"pointer"}),
  subtotal:{display:"grid",padding:"6px 4px",borderTop:"2px solid #0058A4",background:"#f0f4fa",fontWeight:700,fontSize:12},
  pgActionRow:{padding:"6px 10px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"},
  adBlk:{border:"2px dashed",borderRadius:6,margin:"6px 10px",overflow:"hidden"},
  adH:(t,sel)=>({background:sel?"#fff3e0":t==="ADD"?"#e8f5e9":"#fbe9e7",padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${t==="ADD"?"#a5d6a7":"#ef9a9a"}`,gap:8,flexWrap:"wrap"}),
  adBadge:(t)=>({display:"inline-block",padding:"2px 8px",borderRadius:3,fontSize:11,fontWeight:800,background:t==="ADD"?"#2e7d32":"#c62828",color:"#fff",cursor:"pointer"}),
  chk:(dis)=>({width:16,height:16,cursor:dis?"not-allowed":"pointer",opacity:dis?0.3:1,accentColor:"#E46B03",flexShrink:0}),
  actionBar:{position:"fixed",bottom:0,left:0,right:0,background:"#1a1a2e",color:"#fff",padding:"12px 24px",display:"flex",justifyContent:"center",alignItems:"center",gap:20,zIndex:1000,boxShadow:"0 -4px 20px rgba(0,0,0,0.3)",fontSize:14},
  qPage:{background:"#fff",maxWidth:850,margin:"0 auto 24px",border:"1px solid #bbb",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
  qHdr:{padding:"20px 28px 14px",borderBottom:"2px solid #0058A4"},
  qTitle:{fontSize:28,fontWeight:900,color:"#0058A4"},
  qName:{fontSize:14,fontWeight:700,color:"#E46B03",marginTop:2},
  qInfo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:10,fontSize:12},
  qBanner:{background:"#6b7280",color:"#fff",textAlign:"center",padding:"7px 16px",fontWeight:800,fontSize:13,textTransform:"uppercase",letterSpacing:2},
  qPgH:{background:"#0058A4",color:"#fff",padding:"5px 28px",fontWeight:700,fontSize:12,textTransform:"uppercase"},
  qEquip:{padding:"10px 28px 6px",borderBottom:"1px solid #eee"},
  qBullet:{fontSize:12,color:"#444",margin:"1px 0 1px 18px"},
  qTotal:{display:"flex",justifyContent:"space-between",padding:"8px 28px",fontWeight:800,fontSize:13,borderTop:"2px solid #333"},
  qAD:(t)=>({display:"flex",justifyContent:"space-between",padding:"4px 28px",fontWeight:700,fontSize:12,color:t==="ADD"?"#2e7d32":"#c62828"}),
  qDisclaim:{background:"#f5f5f5",padding:"10px 28px",fontSize:10,color:"#777",borderTop:"1px solid #ddd",marginTop:12},
  focusWrap:{display:"grid",gridTemplateColumns:"300px minmax(0,1fr)",gap:10},
  focusNav:{background:"#fff",border:"1px solid #d8dde6",borderRadius:6,padding:8,maxHeight:"72vh",overflow:"auto"},
  focusMain:{background:"#fff",border:"1px solid #d8dde6",borderRadius:6,padding:8,minWidth:0},
  focusLabel:{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.4},
  focusPkg:(a)=>({width:"100%",textAlign:"left",padding:"7px 8px",borderRadius:4,border:a?"1px solid #0058A4":"1px solid #d8dde6",background:a?"#e8f1fb":"#fff",fontWeight:700,cursor:"pointer",marginBottom:6}),
  focusPg:(a)=>({width:"100%",textAlign:"left",padding:"5px 8px",borderRadius:4,border:a?"1px solid #4a7fb6":"1px solid #e2e8f0",background:a?"#f0f6fd":"#fff",cursor:"pointer",marginBottom:4,fontSize:12}),
  focusToolbar:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8},
  focusGridCols:"26px 58px 42px 96px 96px 84px 64px 72px 44px 44px 40px 58px 44px 86px 220px",
  focusHdr:{display:"grid",fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#6b7280",padding:"3px 2px",background:"#f8fafc",borderBottom:"1px solid #d8dde6"},
  focusRow:{display:"grid",padding:"1px 2px",borderBottom:"1px solid #edf2f7",alignItems:"center"},
  focusDelete:{padding:"0 4px",border:"1px solid #d1d5db",borderRadius:3,background:"#fff",color:"#9ca3af",cursor:"pointer",fontSize:12,lineHeight:"16px"},
  focusNoSel:{padding:"16px 12px",fontSize:13,color:"#6b7280"},
  flatCard:{background:"#fff",border:"1px solid #d8dde6",borderRadius:6,padding:8},
  flatToolbar:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8},
  flatGridCols:FLAT_GRID_COLS,
  flatHeader:{display:"grid",gridTemplateColumns:FLAT_GRID_COLS,fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#6b7280",padding:"4px 3px",background:"#f8fafc",border:"1px solid #d8dde6",borderRadius:4,marginBottom:6},
  flatPkgRow:{display:"grid",gridTemplateColumns:"1fr 110px 140px 150px",gap:8,alignItems:"center",padding:"6px 8px",background:"#8f969f",color:"#fff",borderRadius:4,marginBottom:4},
  flatPgRow:{display:"grid",gridTemplateColumns:"24px 1fr 90px 90px 90px 74px",gap:6,alignItems:"center",padding:"6px 8px",background:"#0058A4",color:"#fff",borderRadius:4,marginBottom:2,borderLeft:"4px solid #003f79"},
  flatPkgDrop:{background:"#7f878f",boxShadow:"inset 0 0 0 2px #fbbf24"},
  flatPgDrop:{background:"#004b8f",boxShadow:"inset 0 0 0 2px #fbbf24",borderLeft:"4px solid #fbbf24"},
  flatLabel:{fontSize:10,fontWeight:800,letterSpacing:0.5,textTransform:"uppercase"},
  flatRowInput:{padding:"3px 6px",border:"1px solid rgba(0,0,0,0.2)",borderRadius:3,fontSize:12,width:"100%",boxSizing:"border-box"},
  flatRowInputLight:{padding:"3px 6px",border:"1px solid #b5c9de",borderRadius:3,fontSize:12,width:"100%",boxSizing:"border-box",background:"#fff"},
  flatMiniBtn:(c="#0058A4")=>({padding:"2px 6px",background:"#fff",color:c,border:`1.5px solid ${c}`,borderRadius:4,cursor:"pointer",fontWeight:700,fontSize:11,whiteSpace:"nowrap"}),
  flatLineWrap:{marginBottom:8,borderLeft:"4px solid #e2e8f0",paddingLeft:6},
  flatLineRow:{display:"grid",gridTemplateColumns:FLAT_GRID_COLS,padding:"1px 3px",borderBottom:"1px solid #edf2f7",alignItems:"center"},
  flatNoteRow:{display:"grid",gridTemplateColumns:"92px 72px 1fr",gap:8,alignItems:"start",padding:"5px 3px",borderBottom:"1px solid #edf2f7",background:"#fcfcfd"},
  flatLineDropBefore:{background:"#fffbeb",boxShadow:"inset 0 3px 0 #f59e0b"},
  flatNoteDropBefore:{background:"#fff8e1",boxShadow:"inset 0 3px 0 #f59e0b"},
  flatMoveCell:{display:"flex",gap:2,alignItems:"center"},
  flatMoveBtn:{padding:"0 3px",border:"1px solid #cbd5e1",borderRadius:3,background:"#fff",color:"#64748b",cursor:"pointer",fontSize:10,lineHeight:"14px",fontWeight:700},
  flatDragHandle:{padding:"0 3px",border:"1px dashed #cbd5e1",borderRadius:3,background:"#fff",color:"#64748b",cursor:"grab",fontSize:10,lineHeight:"14px",fontWeight:700,userSelect:"none"},
  flatNoteLabel:{fontSize:12,fontWeight:800,color:"#1f2937",paddingTop:6},
  flatNoteText:{width:"100%",minHeight:56,padding:"5px 6px",border:"1px solid #c7d3e2",borderRadius:4,fontSize:12,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",overflowY:"hidden"},
  flatPgTotalBox:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",border:"1px solid #cfd6df",borderRadius:4,background:"#fff",margin:"4px 0 12px"},
  flatPgTotalLabel:{fontSize:12,fontWeight:700,color:"#4b5563"},
  flatPgTotalValue:{fontSize:14,fontWeight:800,color:"#0b4f91"},
  flatPgTotalLeft:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  flatAdSummary:{display:"grid",gridTemplateColumns:"96px 1fr 120px 62px",gap:8,alignItems:"center",padding:"6px 10px",border:"1px solid #d7e0ea",borderTop:"none",background:"#fff"},
  flatAdType:(t)=>({display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:800,letterSpacing:0.3,color:"#fff",background:t==="ADD"?"#2e7d32":"#c62828",textAlign:"center"}),
  flatAdDesc:{fontSize:12,color:"#1f2937"},
  flatAdAmt:(t)=>({fontSize:12,fontWeight:800,textAlign:"right",color:t==="ADD"?"#2e7d32":"#c62828"}),
  flatAdBox:{border:"1px solid #d7e0ea",borderTop:"none",padding:"8px 10px 10px",background:"#fbfdff",marginBottom:10},
  flatAdTop:{display:"grid",gridTemplateColumns:"96px 1fr 120px 64px 26px",gap:8,alignItems:"center",marginBottom:6},
  flatAdDescInput:{padding:"3px 6px",border:"1px solid #c7d3e2",borderRadius:4,fontSize:12,width:"100%",boxSizing:"border-box"},
  flatAdLineHdr:{display:"grid",fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#6b7280",padding:"4px 3px",background:"#f8fafc",border:"1px solid #d8dde6",borderRadius:4},
  flatAdLineRow:{display:"grid",padding:"3px 3px",borderBottom:"1px solid #e8eef5",alignItems:"center"},
  flatAdHint:{fontSize:11,color:"#64748b",padding:"6px 2px"},
  flatDescRow:{margin:"0 0 6px 0",padding:"6px 8px",border:"1px solid #d9e2ef",borderTop:"none",background:"#fbfdff"},
  flatDescToolbar:{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"},
  flatFmtBtn:{padding:"2px 6px",border:"1px solid #c7d3e2",borderRadius:3,background:"#fff",cursor:"pointer",fontSize:11,fontWeight:700},
  flatDescText:{width:"100%",minHeight:58,padding:"5px 6px",border:"1px solid #c7d3e2",borderRadius:4,fontSize:12,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",overflowY:"hidden"},
  flatDescCell:{display:"flex",justifyContent:"flex-end",alignItems:"center"},
  flatDescToggleIcon:(active)=>({width:22,height:22,padding:0,border:"1px solid #c7d3e2",borderRadius:3,background:active?"#e8f1fb":"#fff",cursor:"pointer",fontSize:12,fontWeight:800,color:active?"#0b4f91":"#355f8a",lineHeight:"20px",textAlign:"center"}),
  flatEndDropZone:{margin:"3px 0 6px",padding:"4px 8px",border:"1px dashed #cbd5e1",borderRadius:4,background:"#f8fafc",color:"#64748b",fontSize:11,fontWeight:600},
  flatEndDropZoneActive:{margin:"3px 0 6px",padding:"4px 8px",border:"1px dashed #f59e0b",borderRadius:4,background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:700,boxShadow:"inset 0 0 0 1px rgba(245,158,11,0.35)"},
};

const TYPE_LABELS={line:"Line Items",note:"Notes",priceGroup:"Price Groups",package:"Packages",addDeduct:"Add/Deducts",adLine:"Add/Deduct Lines"};
const colHeaders=["","Role","Qty","Manufacturer","Equipment","Model","Tag","List","$↑%","Multi","Pay%","Mfg Net","Mfg Comm","Freight","Total Net","MU","Commission","Bid Price","Description","Notes","Cat"];
const focusedHeaders=["","Role","Qty","Mfr","Equipment","Model","Tag","List","$↑%","Multi","Pay%","Freight","MU","Bid Price","Description"];
const flatHeaders=["","Role","Qty","Mfr","Equipment","Model","Tag","List","$↑%","Multi","Pay%","Freight","MU","Bid Price","Desc"];
const flatAdGridCols="44px 110px 110px 96px 72px 48px 48px 60px 48px 86px 26px";
const flatAdHeaders=["Qty","Mfr","Equipment","Model","List","$↑%","Multi","Freight","MU","Bid",""];
const autoPriceGroupTitle = (lineItems) => {
  const names = Array.from(new Set(
    (lineItems || [])
      .filter(l => l?.role === "primary")
      .map(l => String(l?.equipment || "").trim())
      .filter(Boolean)
  ));
  if (names.length === 0) return "New Price Group";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length <= 4) return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  return "Equipment Package Below";
};
const findGroupLocationById = (packages, pkgId, pgId) => {
  for (let pkgIdx = 0; pkgIdx < packages.length; pkgIdx++) {
    const pgIdx = packages[pkgIdx].priceGroups.findIndex(pg => pg.id === pgId);
    if (packages[pkgIdx].id === pkgId && pgIdx >= 0) return { pkgIdx, pgIdx };
  }
  return null;
};
const findPackageIndexById = (packages, pkgId) => packages.findIndex(pkg => pkg.id === pkgId);
const buildGroupOrder = (packages) => {
  const order = [];
  packages.forEach((pkg, pkgIdx) => {
    pkg.priceGroups.forEach((pg, pgIdx) => {
      order.push({ pkgIdx, pgIdx, pkgId: pkg.id, pgId: pg.id });
    });
  });
  return order;
};

// ── Line Item Row ──────────────────────────────────────────
function LineRow({line,onChange,onMove,selected,disabled,onToggle}){
  const c=calc(line);
  const u=(k,v)=>onChange({...line,[k]:v});
  const la={background:"none",border:"1px solid #ddd",color:"#999",borderRadius:2,cursor:"pointer",fontSize:9,padding:"1px 4px",fontWeight:700};
  return(
    <div style={{display:"grid",gridTemplateColumns:S.gridCols,...S.lineRow(line.role,selected)}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} style={S.chk(disabled)}/>
      </div>
      <div style={{display:"flex",gap:2,alignItems:"center"}}>
        <span style={S.badge(line.role)} onClick={()=>u("role",line.role==="primary"?"supporting":"primary")} title="Click to toggle PRI/SUP">{line.role==="primary"?"PRI":"SUP"}</span>
        <button style={la} onClick={()=>onMove(-1)}>▲</button>
        <button style={la} onClick={()=>onMove(1)}>▼</button>
      </div>
      <input style={S.inpSm} type="number" value={line.qty} onChange={e=>u("qty",toNum(e.target.value))}/>
      <input style={S.inpSmL} value={line.manufacturer} onChange={e=>u("manufacturer",e.target.value)} placeholder="Mfr"/>
      <input style={S.inpSmL} value={line.equipment} onChange={e=>u("equipment",e.target.value)} placeholder="Equip"/>
      <input style={S.inpSmL} value={line.model} onChange={e=>u("model",e.target.value)} placeholder="Model"/>
      <input style={S.inpSmL} value={line.tag} onChange={e=>u("tag",e.target.value)} placeholder="Tag"/>
      <input style={S.inpSm} type="number" value={line.list} onChange={e=>u("list",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.dollarUp} onChange={e=>u("dollarUp",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" step="0.01" value={line.multi} onChange={e=>u("multi",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.pay} onChange={e=>u("pay",toNum(e.target.value))}/>
      <div style={S.calcCell}>{fmt(c.mfgNet)}</div>
      <div style={S.calcCell}>{fmt(c.mfgComm)}</div>
      <input style={S.inpSm} type="number" value={line.freight} onChange={e=>u("freight",toNum(e.target.value))}/>
      <div style={S.calcCell}>{fmt(c.totalNet)}</div>
      <input style={S.inpSm} type="number" step="0.01" value={line.mu} onChange={e=>u("mu",toNum(e.target.value))}/>
      <div style={S.calcCellGreen}>{fmt(c.comm)}</div>
      <div style={S.calcCellBlue}>{fmt(c.bidPrice)}</div>
      <input style={S.inpSmL} value={line.description} onChange={e=>u("description",e.target.value)} placeholder="Description"/>
      <input style={S.inpSmL} value={line.notes} onChange={e=>u("notes",e.target.value)} placeholder="Notes"/>
      <select style={{...S.inpSmL,fontSize:10,padding:2}} value={line.category} onChange={e=>u("category",e.target.value)}>
        {CATEGORIES.map(ct=><option key={ct} value={ct}>{ct}</option>)}
      </select>
    </div>
  );
}

// ── Add/Deduct Line Row ────────────────────────────────────
const adGridCols="28px 44px 110px 110px 100px 82px 48px 52px 58px 48px 86px";
const adColHeaders=["","Qty","Manufacturer","Equipment","Model","List","$↑%","Multi","Freight","MU","Bid Price"];

function AddDeductLineRow({line,onChange,selected,disabled,onToggle}){
  const c=calc(line);
  const u=(k,v)=>onChange({...line,[k]:v});
  return(
    <div style={{display:"grid",gridTemplateColumns:adGridCols,padding:"3px 4px",borderBottom:"1px solid #eee",alignItems:"center",background:selected?"#fff3e0":"transparent"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} style={S.chk(disabled)}/>
      </div>
      <input style={S.inpSm} type="number" value={line.qty} onChange={e=>u("qty",toNum(e.target.value))}/>
      <input style={S.inpSmL} value={line.manufacturer} onChange={e=>u("manufacturer",e.target.value)}/>
      <input style={S.inpSmL} value={line.equipment} onChange={e=>u("equipment",e.target.value)}/>
      <input style={S.inpSmL} value={line.model} onChange={e=>u("model",e.target.value)}/>
      <input style={S.inpSm} type="number" value={line.list} onChange={e=>u("list",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.dollarUp} onChange={e=>u("dollarUp",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" step="0.01" value={line.multi} onChange={e=>u("multi",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.freight} onChange={e=>u("freight",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" step="0.01" value={line.mu} onChange={e=>u("mu",toNum(e.target.value))}/>
      <div style={S.calcCellBlue}>{fmt(c.bidPrice)}</div>
    </div>
  );
}

// ── Add/Deduct Section ─────────────────────────────────────
function AddDeductSection({ad,onUpdate,selected,disabled,onToggle,selState}){
  const tot=sumLines(ad.lineItems);
  const updLine=(id,upd)=>onUpdate({...ad,lineItems:ad.lineItems.map(l=>l.id===id?upd:l)});
  const addLine=()=>onUpdate({...ad,lineItems:[...ad.lineItems,{...EMPTY_LINE,id:gid(),groupId:gid()}]});
  const toggleType=()=>onUpdate({...ad,type:ad.type==="ADD"?"DEDUCT":"ADD"});
  const adLineDisabled=selState.isDisabled("adLine");

  return(
    <div style={{...S.adBlk,borderColor:selected?"#E46B03":ad.type==="ADD"?"#66bb6a":"#e57373"}}>
      <div style={S.adH(ad.type,selected)}>
        <div style={{display:"flex",gap:8,alignItems:"center",flex:1}}>
          <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} style={S.chk(disabled)}/>
          <span style={S.adBadge(ad.type)} onClick={toggleType} title="Click to toggle ADD/DEDUCT">{ad.type}</span>
          <input style={{...S.inp,fontWeight:700,maxWidth:400}} value={ad.description} onChange={e=>onUpdate({...ad,description:e.target.value})} placeholder="e.g. DEDUCT TO REMOVE MYLAR FILM"/>
          <span style={{fontSize:12,fontWeight:700,color:ad.type==="ADD"?"#2e7d32":"#c62828",whiteSpace:"nowrap"}}>
            {ad.type==="ADD"?"+":"-"}{fmt(tot.bidPrice)}
          </span>
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <div style={{minWidth:900}}>
          <div style={{display:"grid",gridTemplateColumns:adGridCols,...S.lineHdr}}>
            {adColHeaders.map((h,i)=><div key={i} style={{textAlign:i>=5?"right":"left"}}>{h}</div>)}
          </div>
          {ad.lineItems.map(line=>(
            <AddDeductLineRow key={line.id} line={line} onChange={upd=>updLine(line.id,upd)}
              selected={selState.isSelected(line.id)} disabled={adLineDisabled}
              onToggle={()=>selState.toggle("adLine",line.id)}/>
          ))}
          <div style={{display:"grid",gridTemplateColumns:adGridCols,padding:"5px 4px",borderTop:`2px solid ${ad.type==="ADD"?"#66bb6a":"#e57373"}`,background:ad.type==="ADD"?"#e8f5e9":"#fbe9e7",fontWeight:700,fontSize:12}}>
            <div style={{gridColumn:"1/11",paddingLeft:4,color:ad.type==="ADD"?"#2e7d32":"#c62828"}}>
              {ad.type} TOTAL: {ad.type==="ADD"?"+":"-"}{fmt(tot.bidPrice)}
            </div>
          </div>
        </div>
      </div>
      <div style={{padding:"6px 12px"}}>
        <button style={S.btnO(ad.type==="ADD"?"#2e7d32":"#c62828")} onClick={addLine}>+ Add Line</button>
      </div>
    </div>
  );
}

// ── Price Group ────────────────────────────────────────────
function PriceGroup({pg,onUpdate,onMove,selected,disabled,onToggle,selState}){
  const [batchMU,setBatchMU]=useState("1.35");
  const updLine=(id,upd)=>onUpdate({...pg,lineItems:pg.lineItems.map(l=>l.id===id?upd:l)});
  const moveLineInList=(id,dir)=>{const idx=pg.lineItems.findIndex(l=>l.id===id);onUpdate({...pg,lineItems:moveItem(pg.lineItems,idx,dir)});};
  const addLine=(role)=>{
    const lastPri=[...pg.lineItems].reverse().find(l=>l.role==="primary");
    const newGid=role==="supporting"&&lastPri?lastPri.groupId:gid();
    onUpdate({...pg,lineItems:[...pg.lineItems,{...EMPTY_LINE,id:gid(),role,groupId:newGid}]});
  };
  const applyMU=()=>{const mu=toNum(batchMU);if(mu>0)onUpdate({...pg,lineItems:pg.lineItems.map(l=>({...l,mu}))});};
  const addAD=(type)=>onUpdate({...pg,addDeducts:[...(pg.addDeducts||[]),{id:gid(),type,description:"",lineItems:[{...EMPTY_LINE,id:gid(),groupId:gid()}]}]});
  const updAD=(id,upd)=>onUpdate({...pg,addDeducts:(pg.addDeducts||[]).map(a=>a.id===id?upd:a)});

  const lineDisabled=selState.isDisabled("line");
  const adDisabled=selState.isDisabled("addDeduct");
  const totals=sumLines(pg.lineItems);
  const pgArrow={background:"#fff",border:"1px solid #bbb",color:"#555",borderRadius:3,cursor:"pointer",fontSize:10,padding:"2px 6px",fontWeight:700};

  return(
    <div style={{...S.pgBlk,borderColor:selected?"#E46B03":"#ddd",borderWidth:selected?2:1}}>
      <div style={{...S.pgH,background:selected?"#fff3e0":"#e9eef5"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flex:1}}>
          <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} style={S.chk(disabled)}/>
          <input style={{...S.inp,fontWeight:700,maxWidth:320}} value={pg.name} onChange={e=>onUpdate({...pg,name:e.target.value})}/>
          <span style={{fontSize:12,fontWeight:700,color:"#0058A4",whiteSpace:"nowrap"}}>Bid: {fmt(totals.bidPrice)}</span>
          <span style={{fontSize:11,color:"#666",whiteSpace:"nowrap"}}>Net: {fmt(totals.totalNet)}</span>
          <span style={{fontSize:11,color:"#2e7d32",whiteSpace:"nowrap"}}>Comm: {fmt(totals.comm)}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button style={pgArrow} onClick={()=>onMove(-1)}>▲</button>
          <button style={pgArrow} onClick={()=>onMove(1)}>▼</button>
          <input style={{...S.inpSm,width:52}} type="number" step="0.01" value={batchMU} onChange={e=>setBatchMU(e.target.value)}/>
          <button style={S.btn("#0058A4",11)} onClick={applyMU}>Set MU</button>
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <div style={{minWidth:1400}}>
          <div style={{display:"grid",gridTemplateColumns:S.gridCols,...S.lineHdr}}>
            {colHeaders.map((h,i)=><div key={i} style={{textAlign:i>=11&&i<=17?"right":"left"}}>{h}</div>)}
          </div>
          {pg.lineItems.map(line=>(
            <LineRow key={line.id} line={line} onChange={upd=>updLine(line.id,upd)} onMove={dir=>moveLineInList(line.id,dir)}
              selected={selState.isSelected(line.id)} disabled={lineDisabled}
              onToggle={()=>selState.toggle("line",line.id)}/>
          ))}
          <div style={{display:"grid",gridTemplateColumns:S.gridCols,...S.subtotal}}>
            <div style={{gridColumn:"1/7",color:"#0058A4",paddingLeft:4}}>SUBTOTAL</div>
            <div></div><div></div><div></div><div></div><div></div>
            <div style={{textAlign:"right"}}>{fmt(totals.mfgNet)}</div>
            <div style={{textAlign:"right"}}>{fmt(totals.mfgComm)}</div>
            <div style={{textAlign:"right"}}>{fmt(totals.freight)}</div>
            <div style={{textAlign:"right"}}>{fmt(totals.totalNet)}</div>
            <div></div>
            <div style={{textAlign:"right",color:"#2e7d32"}}>{fmt(totals.comm)}</div>
            <div style={{textAlign:"right",color:"#0058A4"}}>{fmt(totals.bidPrice)}</div>
            <div></div><div></div><div></div>
          </div>
        </div>
      </div>
      <div style={S.pgActionRow}>
        <button style={S.btnO()} onClick={()=>addLine("primary")}>+ Primary Line</button>
        <button style={S.btnO("#78909c")} onClick={()=>addLine("supporting")}>+ Supporting Line</button>
        <button style={S.btnO("#2e7d32")} onClick={()=>addAD("ADD")}>+ Add Alternate</button>
        <button style={S.btnO("#c62828")} onClick={()=>addAD("DEDUCT")}>+ Deduct Alternate</button>
      </div>
      {(pg.addDeducts||[]).map(ad=>(
        <AddDeductSection key={ad.id} ad={ad} onUpdate={upd=>updAD(ad.id,upd)}
          selected={selState.isSelected(ad.id)} disabled={adDisabled}
          onToggle={()=>selState.toggle("addDeduct",ad.id)} selState={selState}/>
      ))}
    </div>
  );
}

// ── Action Bar ─────────────────────────────────────────────
function ActionBar({sel,onDelete,onClear,onCopy}){
  if(sel.ids.length===0)return null;
  return(
    <div style={S.actionBar}>
      <span style={{fontWeight:700,fontSize:15}}>{sel.ids.length} {TYPE_LABELS[sel.type]||sel.type} selected</span>
      {onCopy&&<button style={{...S.btn("#0058A4",14),padding:"8px 24px"}} onClick={onCopy}>Copy Selected</button>}
      <button style={{...S.btn("#c62828",14),padding:"8px 24px"}} onClick={onDelete}>Delete Selected</button>
      <button style={{...S.btn("transparent",13),border:"1px solid rgba(255,255,255,0.4)",padding:"7px 18px"}} onClick={onClear}>Clear Selection</button>
    </div>
  );
}

// ── Package Batch MU ───────────────────────────────────────
function PackageBatchMU({onApply}){
  const [v,setV]=useState("1.35");
  return(<>
    <input style={{width:52,padding:"3px 5px",border:"1px solid rgba(255,255,255,0.35)",borderRadius:3,fontSize:12,background:"rgba(255,255,255,0.15)",color:"#fff",textAlign:"right"}}
      type="number" step="0.01" value={v} onChange={e=>setV(e.target.value)}/>
    <button style={{...S.btn("rgba(255,255,255,0.2)",11),border:"1px solid rgba(255,255,255,0.4)"}} onClick={()=>{const mu=toNum(v);if(mu>0)onApply(mu);}}>Set All MU</button>
  </>);
}

// ── Builder View ───────────────────────────────────────────
function BuilderView({data,setData,selState}){
  const [pkgFilter,setPkgFilter]=useState("");
  const [collapsedPkgs,setCollapsedPkgs]=useState({});
  const updPkg=(id,u)=>setData({...data,packages:data.packages.map(p=>p.id===id?{...p,...u}:p)});
  const addPkg=()=>setData({...data,packages:[...data.packages,{id:gid(),name:"New Package",type:"Building",priceGroups:[]}]});
  const movePkg=(id,dir)=>{const idx=data.packages.findIndex(p=>p.id===id);setData({...data,packages:moveItem(data.packages,idx,dir)});};
  const updPG=(pkgId,pgId,upd)=>setData({...data,packages:data.packages.map(p=>p.id===pkgId?{...p,priceGroups:p.priceGroups.map(pg=>pg.id===pgId?upd:pg)}:p)});
  const addPG=(pkgId)=>setData({...data,packages:data.packages.map(p=>p.id===pkgId?{...p,priceGroups:[...p.priceGroups,{id:gid(),name:"New Price Group",lineItems:[],addDeducts:[]}]}:p)});
  const movePG=(pkgId,pgId,dir)=>{setData({...data,packages:data.packages.map(p=>{if(p.id!==pkgId)return p;const idx=p.priceGroups.findIndex(pg=>pg.id===pgId);return{...p,priceGroups:moveItem(p.priceGroups,idx,dir)};})});};
  const batchMUPkg=(pkgId,mu)=>setData({...data,packages:data.packages.map(p=>p.id===pkgId?{...p,priceGroups:p.priceGroups.map(pg=>({...pg,lineItems:pg.lineItems.map(l=>({...l,mu}))}))}:p)});
  const togglePkgCollapsed=(pkgId)=>setCollapsedPkgs(prev=>({...prev,[pkgId]:!prev[pkgId]}));
  const collapseAllPkgs=()=>setCollapsedPkgs(Object.fromEntries(data.packages.map(p=>[p.id,true])));
  const expandAllPkgs=()=>setCollapsedPkgs(Object.fromEntries(data.packages.map(p=>[p.id,false])));

  const pkgDisabled=selState.isDisabled("package");
  const pgDisabled=selState.isDisabled("priceGroup");
  const arrowBtn={background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",color:"#fff",borderRadius:3,cursor:"pointer",fontSize:10,padding:"2px 6px",fontWeight:700};
  const missingRequired = [
    ["Project Name",data.projectName],
    ["Quote #",data.quoteNumber],
    ["Bid Date",data.bidDate],
    ["Sales Engineer",data.salesEngineer],
    ["To",data.to],
  ].filter(([,value])=>!String(value||"").trim());

  const grand=data.packages.reduce((a,p)=>{
    p.priceGroups.forEach(pg=>pg.lineItems.forEach(l=>{const c=calc(l);a.totalNet+=c.totalNet;a.bidPrice+=c.bidPrice;a.comm+=c.comm;}));
    return a;
  },{totalNet:0,bidPrice:0,comm:0});
  const filterText=pkgFilter.trim().toLowerCase();
  const visiblePackages=data.packages.filter(pkg=>{
    if(!filterText)return true;
    if(pkg.name.toLowerCase().includes(filterText)||pkg.type.toLowerCase().includes(filterText))return true;
    return pkg.priceGroups.some(pg=>pg.name.toLowerCase().includes(filterText));
  });

  return(
    <div style={{paddingBottom:selState.sel.ids.length>0?70:0}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700,color:"#0058A4",fontSize:14}}>Project Details</span>
          <div style={{display:"flex",gap:16,fontSize:13}}>
            <span><strong>Total Net:</strong> {fmt(grand.totalNet)}</span>
            <span style={{color:"#2e7d32"}}><strong>Profit:</strong> {fmt(grand.comm)} ({grand.bidPrice>0?fmtPct(grand.comm/grand.bidPrice):"0%"})</span>
            <span style={{color:"#0058A4"}}><strong>Total Bid:</strong> {fmt(grand.bidPrice)}</span>
          </div>
        </div>
        {missingRequired.length>0&&(
          <div style={S.warnBox}>
            Missing required project details: {missingRequired.map(([k])=>k).join(", ")}
          </div>
        )}
        <div style={S.filterWrap}>
          <input
            style={S.filterInput}
            value={pkgFilter}
            onChange={e=>setPkgFilter(e.target.value)}
            placeholder="Filter packages / price groups"
          />
          {pkgFilter&&<button style={S.btnO("#666")} onClick={()=>setPkgFilter("")}>Clear Filter</button>}
          <button style={S.btnO("#666")} onClick={collapseAllPkgs}>Collapse All</button>
          <button style={S.btnO("#666")} onClick={expandAllPkgs}>Expand All</button>
        </div>
        <div style={S.row}>
          {[["Project Name","projectName",260],["Location","location",180],["Engineer","engineer",140],["Market","market",120]].map(([l,k,w])=>(
            <div key={k} style={S.fld(w)}><span style={S.lbl}>{l}</span><input style={S.inp} value={data[k]} onChange={e=>setData({...data,[k]:e.target.value})}/></div>
          ))}
        </div>
        <div style={S.row}>
          {[["Bid Date","bidDate",120],["Quote #","quoteNumber",100],["Quote Name","quoteName",140],["Addendums","addendums",70],["Date","date",120],["Phase","phase",110]].map(([l,k,w])=>(
            <div key={k} style={S.fld(w)}><span style={S.lbl}>{l}</span><input style={S.inp} value={data[k]} onChange={e=>setData({...data,[k]:e.target.value})}/></div>
          ))}
        </div>
        <div style={S.row}>
          {[["Sales Engineer","salesEngineer",160],["Project Engineer","projectEngineer",160],["To","to",200]].map(([l,k,w])=>(
            <div key={k} style={S.fld(w)}><span style={S.lbl}>{l}</span><input style={S.inp} value={data[k]} onChange={e=>setData({...data,[k]:e.target.value})}/></div>
          ))}
        </div>
      </div>

      {visiblePackages.map(pkg=>{
        const pkgTotals=pkg.priceGroups.reduce((a,pg)=>{pg.lineItems.forEach(l=>{const c=calc(l);a.totalNet+=c.totalNet;a.bidPrice+=c.bidPrice;a.comm+=c.comm;});return a;},{totalNet:0,bidPrice:0,comm:0});
        const pkgSel=selState.isSelected(pkg.id);
        const collapsed=!!collapsedPkgs[pkg.id];
        return(
          <div key={pkg.id} style={{...S.pkg,borderColor:pkgSel?"#E46B03":"#0058A4"}}>
            <div style={{...S.pkgH,background:pkgSel?"#c85000":"#0058A4"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <input type="checkbox" checked={pkgSel} disabled={pkgDisabled} onChange={()=>selState.toggle("package",pkg.id)} style={{...S.chk(pkgDisabled),accentColor:"#fff"}}/>
                <input style={{...S.pkgHInp,width:280}} value={pkg.name} onChange={e=>updPkg(pkg.id,{name:e.target.value})}/>
                <select style={S.pkgHSel} value={pkg.type} onChange={e=>updPkg(pkg.id,{type:e.target.value})}>
                  {PKG_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{fontSize:12,opacity:0.9}}>Bid: {fmt(pkgTotals.bidPrice)}</span>
                <span style={{fontSize:11,opacity:0.7}}>Comm: {fmt(pkgTotals.comm)}</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button style={arrowBtn} onClick={()=>togglePkgCollapsed(pkg.id)}>{collapsed?"Show":"Hide"}</button>
                <button style={arrowBtn} onClick={()=>movePkg(pkg.id,-1)}>▲</button>
                <button style={arrowBtn} onClick={()=>movePkg(pkg.id,1)}>▼</button>
                <PackageBatchMU onApply={mu=>batchMUPkg(pkg.id,mu)}/>
              </div>
            </div>
            {!collapsed&&(
              <div style={{padding:"8px 0"}}>
                {pkg.priceGroups.map(pg=>(
                  <PriceGroup key={pg.id} pg={pg} onUpdate={upd=>updPG(pkg.id,pg.id,upd)} onMove={dir=>movePG(pkg.id,pg.id,dir)}
                    selected={selState.isSelected(pg.id)} disabled={pgDisabled}
                    onToggle={()=>selState.toggle("priceGroup",pg.id)} selState={selState}/>
                ))}
                <div style={{padding:"4px 12px"}}>
                  <button style={S.btn()} onClick={()=>addPG(pkg.id)}>+ Add Price Group</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {visiblePackages.length===0&&<div style={S.warnBox}>No packages match this filter.</div>}
      <button style={{...S.btn("#E46B03",15),padding:"10px 28px",marginTop:4}} onClick={addPkg}>+ Add New Package</button>
    </div>
  );
}

function FocusedLineRow({line,onChange,onDelete}){
  const c=calc(line);
  const u=(k,v)=>onChange({...line,[k]:v});
  return(
    <div style={{...S.focusRow,gridTemplateColumns:S.focusGridCols}}>
      <button style={S.focusDelete} onClick={onDelete} title="Delete line">×</button>
      <select style={{...S.inpSmL,fontSize:10,padding:2}} value={line.role} onChange={e=>u("role",e.target.value)}>
        <option value="primary">PRI</option>
        <option value="supporting">SUP</option>
      </select>
      <input style={S.inpSm} type="number" value={line.qty} onChange={e=>u("qty",toNum(e.target.value))}/>
      <input style={S.inpSmL} value={line.manufacturer} onChange={e=>u("manufacturer",e.target.value)}/>
      <input style={S.inpSmL} value={line.equipment} onChange={e=>u("equipment",e.target.value)}/>
      <input style={S.inpSmL} value={line.model} onChange={e=>u("model",e.target.value)}/>
      <input style={S.inpSmL} value={line.tag} onChange={e=>u("tag",e.target.value)}/>
      <input style={S.inpSm} type="number" value={line.list} onChange={e=>u("list",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.dollarUp} onChange={e=>u("dollarUp",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" step="0.01" value={line.multi} onChange={e=>u("multi",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.pay} onChange={e=>u("pay",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" value={line.freight} onChange={e=>u("freight",toNum(e.target.value))}/>
      <input style={S.inpSm} type="number" step="0.01" value={line.mu} onChange={e=>u("mu",toNum(e.target.value))}/>
      <div style={S.calcCellBlue}>{fmt(c.bidPrice)}</div>
      <input style={S.inpSmL} value={line.description} onChange={e=>u("description",e.target.value)} placeholder="Use | between bullets"/>
    </div>
  );
}

function FocusedBuilderView({data,setData}){
  const [selectedPkgId,setSelectedPkgId]=useState(data.packages[0]?.id||null);
  const [selectedPgId,setSelectedPgId]=useState(data.packages[0]?.priceGroups?.[0]?.id||null);
  const [lineFilter,setLineFilter]=useState("");

  useEffect(()=>{
    if(data.packages.length===0){
      setSelectedPkgId(null);
      setSelectedPgId(null);
      return;
    }
    const pkg=data.packages.find(p=>p.id===selectedPkgId)||data.packages[0];
    if(pkg.id!==selectedPkgId)setSelectedPkgId(pkg.id);
    if(pkg.priceGroups.length===0){
      setSelectedPgId(null);
      return;
    }
    const pg=pkg.priceGroups.find(x=>x.id===selectedPgId)||pkg.priceGroups[0];
    if(pg.id!==selectedPgId)setSelectedPgId(pg.id);
  },[data,selectedPkgId,selectedPgId]);

  const selectedPkg=data.packages.find(p=>p.id===selectedPkgId)||null;
  const selectedPg=selectedPkg?.priceGroups.find(pg=>pg.id===selectedPgId)||null;
  const grand=data.packages.reduce((a,p)=>{
    p.priceGroups.forEach(pg=>pg.lineItems.forEach(l=>{const c=calc(l);a.totalNet+=c.totalNet;a.bidPrice+=c.bidPrice;a.comm+=c.comm;}));
    return a;
  },{totalNet:0,bidPrice:0,comm:0});

  const updateSelectedPg=(updater)=>{
    if(!selectedPkg||!selectedPg)return;
    setData({
      ...data,
      packages:data.packages.map(p=>{
        if(p.id!==selectedPkg.id)return p;
        return {
          ...p,
          priceGroups:p.priceGroups.map(pg=>pg.id===selectedPg.id?updater(pg):pg),
        };
      }),
    });
  };

  const addPackage=()=>{
    const pkg={id:gid(),name:"New Package",type:"Building",priceGroups:[]};
    setData({...data,packages:[...data.packages,pkg]});
    setSelectedPkgId(pkg.id);
    setSelectedPgId(null);
  };
  const addPriceGroup=()=>{
    if(!selectedPkg)return;
    const pg={id:gid(),name:"New Price Group",lineItems:[],addDeducts:[]};
    setData({
      ...data,
      packages:data.packages.map(p=>p.id===selectedPkg.id?{...p,priceGroups:[...p.priceGroups,pg]}:p),
    });
    setSelectedPgId(pg.id);
  };
  const addLine=(role)=>{
    updateSelectedPg(pg=>({...pg,lineItems:[...pg.lineItems,{...EMPTY_LINE,id:gid(),role,groupId:gid()}]}));
  };
  const updateLine=(lineId,updated)=>{
    updateSelectedPg(pg=>({...pg,lineItems:pg.lineItems.map(l=>l.id===lineId?updated:l)}));
  };
  const deleteLine=(lineId)=>{
    updateSelectedPg(pg=>({...pg,lineItems:pg.lineItems.filter(l=>l.id!==lineId)}));
  };
  const filteredLines=(selectedPg?.lineItems||[]).filter(l=>{
    const t=lineFilter.trim().toLowerCase();
    if(!t)return true;
    return [l.manufacturer,l.equipment,l.model,l.tag,l.description,l.notes].some(v=>String(v||"").toLowerCase().includes(t));
  });

  return(
    <div style={{paddingBottom:8}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:800,color:"#0058A4"}}>Focused Sheet Builder</div>
            <div style={{fontSize:12,color:"#6b7280"}}>Hierarchy on left, spreadsheet entry on right</div>
          </div>
          <div style={{display:"flex",gap:14,fontSize:13}}>
            <span><strong>Total Net:</strong> {fmt(grand.totalNet)}</span>
            <span style={{color:"#2e7d32"}}><strong>Profit:</strong> {fmt(grand.comm)}</span>
            <span style={{color:"#0058A4"}}><strong>Total Bid:</strong> {fmt(grand.bidPrice)}</span>
          </div>
        </div>
        <div style={S.focusWrap}>
          <div style={S.focusNav}>
            <div style={S.focusToolbar}>
              <button style={S.btnO()} onClick={addPackage}>+ Package</button>
            </div>
            {data.packages.map(pkg=>{
              const pTotal=pkg.priceGroups.reduce((a,pg)=>{a+=sumLines(pg.lineItems).bidPrice;return a;},0);
              const pkgActive=pkg.id===selectedPkgId;
              return(
                <div key={pkg.id}>
                  <button style={S.focusPkg(pkgActive)} onClick={()=>setSelectedPkgId(pkg.id)}>
                    {pkg.name} <span style={{opacity:0.7,fontWeight:600}}>{fmt(pTotal)}</span>
                  </button>
                  {pkgActive&&(
                    <div style={{padding:"0 0 6px 10px"}}>
                      {pkg.priceGroups.map(pg=>{
                        const pgActive=pg.id===selectedPgId;
                        return(
                          <button key={pg.id} style={S.focusPg(pgActive)} onClick={()=>setSelectedPgId(pg.id)}>
                            {pg.name}
                          </button>
                        );
                      })}
                      <button style={S.btnO("#666")} onClick={addPriceGroup}>+ Price Group</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={S.focusMain}>
            {!selectedPkg&&<div style={S.focusNoSel}>Create or select a package to begin.</div>}
            {selectedPkg&&!selectedPg&&<div style={S.focusNoSel}>Select a price group or add a new one.</div>}
            {selectedPg&&(
              <>
                <div style={S.focusToolbar}>
                  <span style={S.focusLabel}>Package</span>
                  <input style={{...S.inp,width:260}} value={selectedPkg.name} onChange={e=>setData({...data,packages:data.packages.map(p=>p.id===selectedPkg.id?{...p,name:e.target.value}:p)})}/>
                  <span style={S.focusLabel}>Price Group</span>
                  <input style={{...S.inp,width:280}} value={selectedPg.name} onChange={e=>updateSelectedPg(pg=>({...pg,name:e.target.value}))}/>
                  <input style={{...S.inp,width:220}} value={lineFilter} onChange={e=>setLineFilter(e.target.value)} placeholder="Filter lines"/>
                  <button style={S.btnO()} onClick={()=>addLine("primary")}>+ Primary</button>
                  <button style={S.btnO("#78909c")} onClick={()=>addLine("supporting")}>+ Supporting</button>
                </div>
                <div style={{overflowX:"auto"}}>
                  <div style={{minWidth:1500}}>
                    <div style={{...S.focusHdr,gridTemplateColumns:S.focusGridCols}}>
                      {focusedHeaders.map((h,i)=><div key={i} style={{textAlign:i>=13?"right":"left"}}>{h}</div>)}
                    </div>
                    {filteredLines.map(line=>(
                      <FocusedLineRow
                        key={line.id}
                        line={line}
                        onChange={upd=>updateLine(line.id,upd)}
                        onDelete={()=>deleteLine(line.id)}
                      />
                    ))}
                    {filteredLines.length===0&&<div style={S.focusNoSel}>No matching lines.</div>}
                  </div>
                </div>
                <div style={{...S.warnBox,marginTop:8}}>
                  Alternates/Add-Deduct editing stays in the Classic Builder tab in this prototype.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlatSheetLineRow({line,onChange,onDelete,onMoveUp,onMoveDown,onDragStart,onDragEnd,onDragOver,onDropBefore,showDescription,onToggleDescription,isDropBeforeTarget,mfrListId,equipmentListId,selected,disabled,onToggle,isDragActive}){
  const c=calc(line);
  const descRef=useRef(null);
  const noteRef=useRef(null);
  const canHaveDescription=line.role!=="supporting";
  const u=(k,v)=>onChange({...line,[k]:v});
  useEffect(()=>{
    if(!line.isNote||!noteRef.current)return;
    const el=noteRef.current;
    el.style.height="auto";
    el.style.height=`${Math.max(el.scrollHeight,56)}px`;
  },[line.isNote,line.noteText]);
  useEffect(()=>{
    if(line.isNote||!canHaveDescription||!showDescription||!descRef.current)return;
    const el=descRef.current;
    el.style.height="auto";
    el.style.height=`${Math.max(el.scrollHeight,58)}px`;
  },[line.isNote,canHaveDescription,line.description,showDescription]);
  if(line.isNote){
    return(
      <div style={{...S.flatNoteRow,...(isDropBeforeTarget?S.flatNoteDropBefore:null)}} onDragOver={onDragOver} onDrop={onDropBefore}>
        <div style={S.flatMoveCell}>
          <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} style={S.chk(disabled)}/>
          <span
            style={S.flatDragHandle}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Drag notes row"
          >
            ::
          </span>
          <button style={S.flatMoveBtn} onClick={onMoveUp} title="Move up">▲</button>
          <button style={S.flatMoveBtn} onClick={onMoveDown} title="Move down">▼</button>
          <button style={S.focusDelete} onClick={onDelete} title="Delete notes line">×</button>
        </div>
        <span style={{...S.flatNoteLabel,...(isDragActive?{pointerEvents:"none"}:null)}}>NOTES:</span>
        <textarea
          ref={noteRef}
          style={{...S.flatNoteText,...(isDragActive?{pointerEvents:"none"}:null)}}
          rows={Math.min(14,Math.max(3,(line.noteText?line.noteText.split(/\r?\n/).length:1)+1))}
          value={line.noteText}
          onChange={e=>u("noteText",e.target.value)}
          placeholder="- This is the first note."
        />
      </div>
    );
  }
  const applyDescStyle=(marker)=>{
    const el=descRef.current;
    if(!el)return;
    const start=el.selectionStart||0;
    const end=el.selectionEnd||0;
    const src=line.description||"";
    const before=src.slice(0,start);
    const mid=src.slice(start,end)||"text";
    const after=src.slice(end);
    const next=before+marker+mid+marker+after;
    u("description",next);
    requestAnimationFrame(()=>{
      const node=descRef.current;
      if(!node)return;
      const caretStart=start+marker.length;
      const caretEnd=caretStart+mid.length;
      node.focus();
      node.setSelectionRange(caretStart,caretEnd);
    });
  };
  return(
    <>
      <div style={{...S.flatLineRow,...(isDropBeforeTarget?S.flatLineDropBefore:null)}} onDragOver={onDragOver} onDrop={onDropBefore}>
        <div style={S.flatMoveCell}>
          <input type="checkbox" checked={selected} disabled={disabled} onChange={onToggle} style={S.chk(disabled)}/>
          <span
            style={S.flatDragHandle}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Drag line"
          >
            ::
          </span>
          <button style={S.flatMoveBtn} onClick={onMoveUp} title="Move up">▲</button>
          <button style={S.flatMoveBtn} onClick={onMoveDown} title="Move down">▼</button>
          <button style={S.focusDelete} onClick={onDelete} title="Delete line">×</button>
        </div>
        <select style={{...S.inpSmL,fontSize:10,padding:2}} value={line.role} onChange={e=>u("role",e.target.value)}>
          <option value="primary">PRI</option>
          <option value="supporting">SUP</option>
        </select>
        <input style={S.inpSm} type="number" value={line.qty} onChange={e=>u("qty",toNum(e.target.value))}/>
        <input style={S.inpSmL} list={mfrListId} value={line.manufacturer} onChange={e=>u("manufacturer",e.target.value)}/>
        <input style={S.inpSmL} list={equipmentListId} value={line.equipment} onChange={e=>u("equipment",e.target.value)}/>
        <input style={S.inpSmL} value={line.model} onChange={e=>u("model",e.target.value)}/>
        <input style={S.inpSmL} value={line.tag} onChange={e=>u("tag",e.target.value)}/>
        <CurrencyInput style={S.inpSm} value={line.list} onChange={v=>u("list",v)}/>
        <input style={S.inpSm} type="number" value={line.dollarUp} onChange={e=>u("dollarUp",toNum(e.target.value))}/>
        <input style={S.inpSm} type="number" step="0.01" value={line.multi} onChange={e=>u("multi",toNum(e.target.value))}/>
        <input style={S.inpSm} type="number" value={line.pay} onChange={e=>u("pay",toNum(e.target.value))}/>
        <CurrencyInput style={S.inpSm} value={line.freight} onChange={v=>u("freight",v)}/>
        <input style={S.inpSm} type="number" step="0.01" value={line.mu} onChange={e=>u("mu",toNum(e.target.value))}/>
        <div style={S.calcCellBlue}>{fmt(c.bidPrice)}</div>
        {canHaveDescription?(
          <div style={S.flatDescCell}>
            <button
              style={S.flatDescToggleIcon(showDescription||!!line.description)}
              onClick={onToggleDescription}
              title={showDescription?"Hide description":"Show description"}
            >
              {showDescription?"▾":"▸"}
            </button>
          </div>
        ):(
          <span style={{fontSize:11,color:"#9ca3af",paddingLeft:4,textAlign:"right"}}>Supp</span>
        )}
      </div>
      {canHaveDescription&&showDescription&&(
        <div style={S.flatDescRow}>
          <div style={S.flatDescToolbar}>
            <button style={S.flatFmtBtn} onClick={()=>applyDescStyle("**")}><strong>B</strong></button>
            <button style={S.flatFmtBtn} onClick={()=>applyDescStyle("__")}><span style={{textDecoration:"underline"}}>U</span></button>
          </div>
          <textarea
            ref={descRef}
            style={S.flatDescText}
            rows={Math.min(16,Math.max(3,(line.description?line.description.split(/\r?\n/).length:1)+1))}
            value={line.description}
            onChange={e=>u("description",e.target.value)}
            placeholder="Enter quote bullets line-by-line"
          />
        </div>
      )}
    </>
  );
}

function FlatAddDeductSection({ad,isOpen,onToggleOpen,onUpdate,onDelete,onAddLine,onUpdateLine,onDeleteLine,mfrListId,equipmentListId}){
  const total=sumLines(ad.lineItems||[]).bidPrice;
  const tone=ad.type==="ADD"?"#2e7d32":"#c62828";
  const signedTotal=`${ad.type==="ADD"?"+":"-"}${fmt(total)}`;
  return(
    <>
      <div style={S.flatAdSummary}>
        <span style={S.flatAdType(ad.type)}>{ad.type==="ADD"?"ADDER":"DEDUCT"}</span>
        <span style={S.flatAdDesc}>{ad.description||"(enter optional scope description)"}</span>
        <span style={S.flatAdAmt(ad.type)}>{signedTotal}</span>
        <button style={S.flatMoveBtn} onClick={onToggleOpen} title={isOpen?"Hide details":"Edit details"}>{isOpen?"Hide":"Edit"}</button>
      </div>
      {isOpen&&(
        <div style={S.flatAdBox}>
          <div style={S.flatAdTop}>
            <span style={S.flatAdType(ad.type)}>{ad.type==="ADD"?"ADDER":"DEDUCT"}</span>
            <input
              style={S.flatAdDescInput}
              value={ad.description||""}
              onChange={e=>onUpdate({...ad,description:e.target.value})}
              placeholder="Optional scope text shown under Total Net in quote"
            />
            <span style={S.flatAdAmt(ad.type)}>{signedTotal}</span>
            <button style={S.btnO(tone)} onClick={onAddLine}>+ Line</button>
            <button style={S.focusDelete} onClick={onDelete} title="Delete optional line">×</button>
          </div>
          <div style={{...S.flatAdLineHdr,gridTemplateColumns:flatAdGridCols}}>
            {flatAdHeaders.map((h,i)=><div key={i} style={{textAlign:i>=4&&i<=9?"right":"left"}}>{h}</div>)}
          </div>
          {(ad.lineItems||[]).map(line=>{
            const c=calc(line);
            const u=(k,v)=>onUpdateLine(line.id,{...line,role:"supporting",isNote:false,noteText:"",[k]:v});
            return(
              <div key={line.id} style={{...S.flatAdLineRow,gridTemplateColumns:flatAdGridCols}}>
                <input style={S.inpSm} type="number" value={line.qty} onChange={e=>u("qty",toNum(e.target.value))}/>
                <input style={S.inpSmL} list={mfrListId} value={line.manufacturer} onChange={e=>u("manufacturer",e.target.value)}/>
                <input style={S.inpSmL} list={equipmentListId} value={line.equipment} onChange={e=>u("equipment",e.target.value)}/>
                <input style={S.inpSmL} value={line.model} onChange={e=>u("model",e.target.value)}/>
                <CurrencyInput style={S.inpSm} value={line.list} onChange={v=>u("list",v)}/>
                <input style={S.inpSm} type="number" value={line.dollarUp} onChange={e=>u("dollarUp",toNum(e.target.value))}/>
                <input style={S.inpSm} type="number" step="0.01" value={line.multi} onChange={e=>u("multi",toNum(e.target.value))}/>
                <CurrencyInput style={S.inpSm} value={line.freight} onChange={v=>u("freight",v)}/>
                <input style={S.inpSm} type="number" step="0.01" value={line.mu} onChange={e=>u("mu",toNum(e.target.value))}/>
                <div style={S.calcCellBlue}>{fmt(c.bidPrice)}</div>
                <button style={S.focusDelete} onClick={()=>onDeleteLine(line.id)} title="Delete line">×</button>
              </div>
            );
          })}
          {(ad.lineItems||[]).length===0&&<div style={S.flatAdHint}>No lines yet. Add at least one supporting line to price this option.</div>}
        </div>
      )}
    </>
  );
}

function FlatSheetBuilderView({data,setData,selState}){
  const [filter,setFilter]=useState("");
  const [descDefaultOpen,setDescDefaultOpen]=useState(false);
  const [descOverrides,setDescOverrides]=useState({});
  const [adOpen,setAdOpen]=useState({});
  const [dragItem,setDragItem]=useState(null);
  const [dropHint,setDropHint]=useState(null);
  const mfrListId="flat-mfr-options";
  const equipmentListId="flat-equipment-options";
  const setHint=(next)=>setDropHint(prev=>{
    if(!prev&&!next)return prev;
    if(prev&&next&&prev.type===next.type&&prev.pkgId===next.pkgId&&prev.pgId===next.pgId&&prev.lineId===next.lineId)return prev;
    return next;
  });
  const makeAdLine=()=>({...EMPTY_LINE,id:gid(),role:"supporting",groupId:gid(),isNote:false,noteText:""});
  const autoLists=useMemo(()=>{
    const mfrSet=new Set(DEFAULT_MFR_OPTIONS);
    const equipSet=new Set(DEFAULT_EQUIPMENT_OPTIONS);
    data.packages.forEach(pkg=>{
      pkg.priceGroups.forEach(pg=>{
        (pg.lineItems||[]).forEach(line=>{
          if(line?.isNote)return;
          const mfr=String(line.manufacturer||"").trim();
          const equip=String(line.equipment||"").trim();
          if(mfr)mfrSet.add(mfr);
          if(equip&&equip!=="NOTES")equipSet.add(equip);
        });
        (pg.addDeducts||[]).forEach(ad=>{
          (ad.lineItems||[]).forEach(line=>{
            const mfr=String(line.manufacturer||"").trim();
            const equip=String(line.equipment||"").trim();
            if(mfr)mfrSet.add(mfr);
            if(equip&&equip!=="NOTES")equipSet.add(equip);
          });
        });
      });
    });
    return {
      mfr:[...mfrSet].sort((a,b)=>a.localeCompare(b)),
      equip:[...equipSet].sort((a,b)=>a.localeCompare(b)),
    };
  },[data]);
  const grand=data.packages.reduce((a,p)=>{
    p.priceGroups.forEach(pg=>pg.lineItems.forEach(l=>{const c=calc(l);a.totalNet+=c.totalNet;a.bidPrice+=c.bidPrice;a.comm+=c.comm;}));
    return a;
  },{totalNet:0,bidPrice:0,comm:0});

  const updatePkg=(pkgId,patch)=>setData({...data,packages:data.packages.map(p=>p.id===pkgId?{...p,...patch}:p)});
  const updatePg=(pkgId,pgId,patch)=>setData({...data,packages:data.packages.map(p=>p.id===pkgId?{...p,priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{...pg,...patch}:pg)}:p)});
  const updateLine=(pkgId,pgId,lineId,updated)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>{
        if(pg.id!==pgId)return pg;
        const lineItems=pg.lineItems.map(l=>l.id===lineId?updated:l);
        return {...pg,lineItems,name:autoPriceGroupTitle(lineItems)};
      }),
    }:p),
  });
  const deleteLine=(pkgId,pgId,lineId)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>{
        if(pg.id!==pgId)return pg;
        const lineItems=pg.lineItems.filter(l=>l.id!==lineId);
        return {...pg,lineItems,name:autoPriceGroupTitle(lineItems)};
      }),
    }:p),
  });
  const addOptional=(pkgId,pgId,type)=>{
    const newAd={id:gid(),type,description:"",lineItems:[makeAdLine()]};
    setData({
      ...data,
      packages:data.packages.map(p=>p.id===pkgId?{
        ...p,
        priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{...pg,addDeducts:[...(pg.addDeducts||[]),newAd]}:pg),
      }:p),
    });
    setAdOpen(prev=>({...prev,[newAd.id]:true}));
  };
  const updateOptional=(pkgId,pgId,adId,updated)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{
        ...pg,
        addDeducts:(pg.addDeducts||[]).map(ad=>ad.id===adId?updated:ad),
      }:pg),
    }:p),
  });
  const deleteOptional=(pkgId,pgId,adId)=>{
    setData({
      ...data,
      packages:data.packages.map(p=>p.id===pkgId?{
        ...p,
        priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{
          ...pg,
          addDeducts:(pg.addDeducts||[]).filter(ad=>ad.id!==adId),
        }:pg),
      }:p),
    });
    setAdOpen(prev=>{
      const next={...prev};
      delete next[adId];
      return next;
    });
  };
  const addOptionalLine=(pkgId,pgId,adId)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{
        ...pg,
        addDeducts:(pg.addDeducts||[]).map(ad=>ad.id===adId?{...ad,lineItems:[...(ad.lineItems||[]),makeAdLine()]}:ad),
      }:pg),
    }:p),
  });
  const updateOptionalLine=(pkgId,pgId,adId,lineId,updated)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{
        ...pg,
        addDeducts:(pg.addDeducts||[]).map(ad=>ad.id===adId?{
          ...ad,
          lineItems:(ad.lineItems||[]).map(line=>line.id===lineId?{...updated,role:"supporting",isNote:false,noteText:""}:line),
        }:ad),
      }:pg),
    }:p),
  });
  const deleteOptionalLine=(pkgId,pgId,adId,lineId)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>pg.id===pgId?{
        ...pg,
        addDeducts:(pg.addDeducts||[]).map(ad=>ad.id===adId?{
          ...ad,
          lineItems:(ad.lineItems||[]).filter(line=>line.id!==lineId),
        }:ad),
      }:pg),
    }:p),
  });
  const toggleOptionalOpen=(adId)=>setAdOpen(prev=>({...prev,[adId]:!(Object.prototype.hasOwnProperty.call(prev,adId)?prev[adId]:false)}));

  const addPackage=()=>setData({...data,packages:[...data.packages,{id:gid(),name:"New Package",type:"Building",priceGroups:[]}]});
  const addPriceGroup=(pkgId)=>setData({...data,packages:data.packages.map(p=>p.id===pkgId?{...p,priceGroups:[...p.priceGroups,{id:gid(),name:"New Price Group",lineItems:[],addDeducts:[]}]}:p)});
  const addLine=(pkgId,pgId,role)=>setData({
    ...data,
    packages:data.packages.map(p=>p.id===pkgId?{
      ...p,
      priceGroups:p.priceGroups.map(pg=>{
        if(pg.id!==pgId)return pg;
        const lastPrimary=[...pg.lineItems].reverse().find(l=>l.role==="primary"&&!l.isNote);
        const noteGroupId=lastPrimary?lastPrimary.groupId:gid();
        const newLine=role==="note"
          ? {...EMPTY_LINE,id:gid(),role:"supporting",groupId:noteGroupId,isNote:true,noteText:"",equipment:"NOTES"}
          : {...EMPTY_LINE,id:gid(),role,groupId:gid()};
        const lineItems=[...pg.lineItems,newLine];
        return {...pg,lineItems,name:autoPriceGroupTitle(lineItems)};
      }),
    }:p),
  });
  const movePriceGroup=(pkgId,pgId,dir)=>setData(current=>{
    const packages=current.packages.map(pkg=>({...pkg,priceGroups:[...pkg.priceGroups]}));
    const loc=findGroupLocationById(packages,pkgId,pgId);
    if(!loc)return current;
    const {pkgIdx,pgIdx}=loc;
    const srcPkg=packages[pkgIdx];
    if(dir<0){
      if(pgIdx>0){
        [srcPkg.priceGroups[pgIdx-1],srcPkg.priceGroups[pgIdx]]=[srcPkg.priceGroups[pgIdx],srcPkg.priceGroups[pgIdx-1]];
      }else if(pkgIdx>0){
        const [moved]=srcPkg.priceGroups.splice(pgIdx,1);
        packages[pkgIdx-1].priceGroups.push(moved);
      }else return current;
    }else{
      if(pgIdx<srcPkg.priceGroups.length-1){
        [srcPkg.priceGroups[pgIdx],srcPkg.priceGroups[pgIdx+1]]=[srcPkg.priceGroups[pgIdx+1],srcPkg.priceGroups[pgIdx]];
      }else if(pkgIdx<packages.length-1){
        const [moved]=srcPkg.priceGroups.splice(pgIdx,1);
        packages[pkgIdx+1].priceGroups.unshift(moved);
      }else return current;
    }
    return {...current,packages};
  });
  const moveLine=(pkgId,pgId,lineId,dir)=>setData(current=>{
    const packages=current.packages.map(pkg=>({
      ...pkg,
      priceGroups:pkg.priceGroups.map(pg=>({...pg,lineItems:[...pg.lineItems]})),
    }));
    const srcLoc=findGroupLocationById(packages,pkgId,pgId);
    if(!srcLoc)return current;
    const srcGroup=packages[srcLoc.pkgIdx].priceGroups[srcLoc.pgIdx];
    const srcLineIdx=srcGroup.lineItems.findIndex(l=>l.id===lineId);
    if(srcLineIdx<0)return current;

    const order=buildGroupOrder(packages);
    const srcOrderIdx=order.findIndex(x=>x.pkgIdx===srcLoc.pkgIdx&&x.pgIdx===srcLoc.pgIdx);
    if(srcOrderIdx<0)return current;

    let targetLoc=null;
    let insertAtStart=false;
    if(dir<0){
      if(srcLineIdx>0){
        [srcGroup.lineItems[srcLineIdx-1],srcGroup.lineItems[srcLineIdx]]=[srcGroup.lineItems[srcLineIdx],srcGroup.lineItems[srcLineIdx-1]];
      }else{
        if(srcOrderIdx===0)return current;
        targetLoc=order[srcOrderIdx-1];
        insertAtStart=false;
      }
    }else{
      if(srcLineIdx<srcGroup.lineItems.length-1){
        [srcGroup.lineItems[srcLineIdx],srcGroup.lineItems[srcLineIdx+1]]=[srcGroup.lineItems[srcLineIdx+1],srcGroup.lineItems[srcLineIdx]];
      }else{
        if(srcOrderIdx===order.length-1)return current;
        targetLoc=order[srcOrderIdx+1];
        insertAtStart=true;
      }
    }

    if(targetLoc){
      const [moved]=srcGroup.lineItems.splice(srcLineIdx,1);
      const dstGroup=packages[targetLoc.pkgIdx].priceGroups[targetLoc.pgIdx];
      if(moved.isNote){
        const lastPrimary=[...dstGroup.lineItems].reverse().find(l=>l.role==="primary"&&!l.isNote);
        moved.groupId=lastPrimary?lastPrimary.groupId:gid();
      }
      if(insertAtStart)dstGroup.lineItems.unshift(moved);
      else dstGroup.lineItems.push(moved);
      srcGroup.name=autoPriceGroupTitle(srcGroup.lineItems);
      dstGroup.name=autoPriceGroupTitle(dstGroup.lineItems);
    }
    return {...current,packages};
  });
  const moveLineToIndex=(sourcePkgId,sourcePgId,lineId,destPkgId,destPgId,destIndex)=>setData(current=>{
    const packages=current.packages.map(pkg=>({
      ...pkg,
      priceGroups:pkg.priceGroups.map(pg=>({...pg,lineItems:[...pg.lineItems]})),
    }));
    const srcLoc=findGroupLocationById(packages,sourcePkgId,sourcePgId);
    const dstLoc=findGroupLocationById(packages,destPkgId,destPgId);
    if(!srcLoc||!dstLoc)return current;
    const srcGroup=packages[srcLoc.pkgIdx].priceGroups[srcLoc.pgIdx];
    const srcIdx=srcGroup.lineItems.findIndex(l=>l.id===lineId);
    if(srcIdx<0)return current;
    const [moved]=srcGroup.lineItems.splice(srcIdx,1);
    const dstGroup=packages[dstLoc.pkgIdx].priceGroups[dstLoc.pgIdx];
    let idx=destIndex;
    if(srcLoc.pkgIdx===dstLoc.pkgIdx&&srcLoc.pgIdx===dstLoc.pgIdx&&srcIdx<idx)idx-=1;
    idx=Math.max(0,Math.min(idx,dstGroup.lineItems.length));
    if(moved.isNote){
      const lastPrimary=[...dstGroup.lineItems].reverse().find(l=>l.role==="primary"&&!l.isNote);
      moved.groupId=lastPrimary?lastPrimary.groupId:gid();
    }
    dstGroup.lineItems.splice(idx,0,moved);
    srcGroup.name=autoPriceGroupTitle(srcGroup.lineItems);
    if(srcGroup===dstGroup)srcGroup.name=autoPriceGroupTitle(srcGroup.lineItems);
    else dstGroup.name=autoPriceGroupTitle(dstGroup.lineItems);
    return {...current,packages};
  });
  const moveGroupToPosition=(sourcePkgId,sourcePgId,destPkgId,destPgId,destPos="before")=>setData(current=>{
    const packages=current.packages.map(pkg=>({...pkg,priceGroups:[...pkg.priceGroups]}));
    const srcLoc=findGroupLocationById(packages,sourcePkgId,sourcePgId);
    const dstPkgIdx=findPackageIndexById(packages,destPkgId);
    if(!srcLoc||dstPkgIdx<0)return current;
    const [moved]=packages[srcLoc.pkgIdx].priceGroups.splice(srcLoc.pgIdx,1);
    let insertIdx;
    if(destPgId){
      let dstPgIdx=packages[dstPkgIdx].priceGroups.findIndex(pg=>pg.id===destPgId);
      if(dstPgIdx<0)dstPgIdx=packages[dstPkgIdx].priceGroups.length;
      insertIdx=destPos==="after"?dstPgIdx+1:dstPgIdx;
      if(srcLoc.pkgIdx===dstPkgIdx&&srcLoc.pgIdx<insertIdx)insertIdx-=1;
    }else{
      insertIdx=packages[dstPkgIdx].priceGroups.length;
      if(srcLoc.pkgIdx===dstPkgIdx&&srcLoc.pgIdx<insertIdx)insertIdx-=1;
    }
    insertIdx=Math.max(0,Math.min(insertIdx,packages[dstPkgIdx].priceGroups.length));
    packages[dstPkgIdx].priceGroups.splice(insertIdx,0,moved);
    return {...current,packages};
  });
  const allowDrop=(e,acceptType,hint)=>{
    if(!dragItem||dragItem.type!==acceptType)return;
    e.preventDefault();
    e.dataTransfer.dropEffect="move";
    if(hint)setHint(hint);
  };
  const clearDrag=()=>{
    setDragItem(null);
    setDropHint(null);
  };
  const onLineDragStart=(e,pkgId,pgId,lineId)=>{
    e.dataTransfer.setData("text/plain",`line:${lineId}`);
    setDropHint(null);
    setDragItem({type:"line",pkgId,pgId,lineId});
  };
  const onGroupDragStart=(e,pkgId,pgId)=>{
    e.dataTransfer.setData("text/plain",`group:${pgId}`);
    setDropHint(null);
    setDragItem({type:"group",pkgId,pgId});
  };
  const toggleDescription=(lineId)=>setDescOverrides(prev=>{
    const has=Object.prototype.hasOwnProperty.call(prev,lineId);
    const effective=has?prev[lineId]:descDefaultOpen;
    const nextVal=!effective;
    const next={...prev,[lineId]:nextVal};
    if(nextVal===descDefaultOpen)delete next[lineId];
    return next;
  });
  const setAllDescriptions=(open)=>{
    setDescDefaultOpen(open);
    setDescOverrides({});
  };
  useEffect(()=>{
    const ids=new Set(data.packages.flatMap(p=>p.priceGroups.flatMap(pg=>pg.lineItems.map(l=>l.id))));
    setDescOverrides(prev=>Object.fromEntries(Object.entries(prev).filter(([id])=>ids.has(id))));
  },[data]);
  useEffect(()=>{
    const ids=new Set(data.packages.flatMap(p=>p.priceGroups.flatMap(pg=>(pg.addDeducts||[]).map(ad=>ad.id))));
    setAdOpen(prev=>Object.fromEntries(Object.entries(prev).filter(([id])=>ids.has(id))));
  },[data]);

  const filterText=filter.trim().toLowerCase();
  const matchesFilter=(pkg,pg,line)=>{
    if(!filterText)return true;
    return [
      pkg.name,
      pg.name,
      line.manufacturer,
      line.equipment,
      line.model,
      line.tag,
      line.description,
      line.noteText,
      line.notes,
    ].some(v=>String(v||"").toLowerCase().includes(filterText));
  };

  return(
    <div style={{paddingBottom:8}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:800,color:"#0058A4"}}>Flat Sheet Builder</div>
            <div style={{fontSize:12,color:"#6b7280"}}>Single-sheet view with Package and Price Group rows inline</div>
          </div>
          <div style={{display:"flex",gap:14,fontSize:13}}>
            <span><strong>Total Net:</strong> {fmt(grand.totalNet)}</span>
            <span style={{color:"#2e7d32"}}><strong>Profit:</strong> {fmt(grand.comm)}</span>
            <span style={{color:"#0058A4"}}><strong>Total Bid:</strong> {fmt(grand.bidPrice)}</span>
          </div>
        </div>
        <div style={S.flatToolbar}>
          <button style={S.btnO()} onClick={addPackage}>+ Package Row</button>
          <input style={{...S.inp,width:260}} value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter rows"/>
          <button style={S.btnO("#666")} onClick={()=>setAllDescriptions(true)}>Expand Descriptions</button>
          <button style={S.btnO("#666")} onClick={()=>setAllDescriptions(false)}>Collapse Descriptions</button>
        </div>
        <datalist id={mfrListId}>
          {autoLists.mfr.map(v=><option key={v} value={v}/>)}
        </datalist>
        <datalist id={equipmentListId}>
          {autoLists.equip.map(v=><option key={v} value={v}/>)}
        </datalist>
        <div style={S.flatCard}>
          <div style={S.flatHeader}>
            {flatHeaders.map((h,i)=><div key={i} style={{textAlign:i>=13?"right":"left"}}>{h}</div>)}
          </div>
          {data.packages.map(pkg=>{
            const pkgBid=pkg.priceGroups.reduce((a,pg)=>a+sumLines(pg.lineItems).bidPrice,0);
            const isPkgDropTarget=dropHint&&dropHint.type==="package"&&dropHint.pkgId===pkg.id;
            const visibleGroups=pkg.priceGroups.map(pg=>({
              pg,
              visibleLines:pg.lineItems.filter(line=>matchesFilter(pkg,pg,line)),
              optionalMatch:(pg.addDeducts||[]).some(ad=>[
                ad.description,
                ...(ad.lineItems||[]).flatMap(line=>[line.manufacturer,line.equipment,line.model,line.tag]),
              ].some(v=>String(v||"").toLowerCase().includes(filterText))),
            })).filter(x=>filterText?x.visibleLines.length>0||x.pg.name.toLowerCase().includes(filterText)||x.optionalMatch:true);
            if(filterText&&visibleGroups.length===0&&!pkg.name.toLowerCase().includes(filterText))return null;
            return(
              <div key={pkg.id}>
                <div
                  style={{...S.flatPkgRow,...(isPkgDropTarget?S.flatPkgDrop:null)}}
                  onDragOver={e=>allowDrop(e,"group",{type:"package",pkgId:pkg.id})}
                  onDrop={e=>{
                    if(!dragItem||dragItem.type!=="group")return;
                    e.preventDefault();
                    moveGroupToPosition(dragItem.pkgId,dragItem.pgId,pkg.id,null,"end");
                    clearDrag();
                  }}
                >
                  <input style={S.flatRowInput} value={pkg.name} onChange={e=>updatePkg(pkg.id,{name:e.target.value})}/>
                  <select style={S.flatRowInput} value={pkg.type} onChange={e=>updatePkg(pkg.id,{type:e.target.value})}>
                    {PKG_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{fontWeight:700,textAlign:"right"}}>{fmt(pkgBid)}</span>
                  <button style={{...S.btnO("#fff"),background:"rgba(255,255,255,0.16)",color:"#fff",borderColor:"rgba(255,255,255,0.45)"}} onClick={()=>addPriceGroup(pkg.id)}>+ Price Group Row</button>
                </div>
                {visibleGroups.map(({pg,visibleLines})=>{
                  const pgTotal=sumLines(pg.lineItems).bidPrice;
                  const optionals=pg.addDeducts||[];
                  const isGroupDropTarget=dropHint&&dropHint.type==="group"&&dropHint.pkgId===pkg.id&&dropHint.pgId===pg.id;
                  const isGroupEndDropTarget=dropHint&&dropHint.type==="line-end"&&dropHint.pkgId===pkg.id&&dropHint.pgId===pg.id;
                  return(
                    <div key={pg.id}>
                      <div
                        style={{...S.flatPgRow,...(isGroupDropTarget?S.flatPgDrop:null),...(isGroupEndDropTarget?S.flatPgDrop:null)}}
                        onDragOver={e=>{
                          if(dragItem?.type==="line"){
                            allowDrop(e,"line",{type:"line-end",pkgId:pkg.id,pgId:pg.id});
                          }else if(dragItem?.type==="group"){
                            allowDrop(e,"group",{type:"group",pkgId:pkg.id,pgId:pg.id});
                          }
                        }}
                        onDrop={e=>{
                          if(!dragItem)return;
                          e.preventDefault();
                          if(dragItem.type==="line"){
                            const idx=pg.lineItems.length;
                            moveLineToIndex(dragItem.pkgId,dragItem.pgId,dragItem.lineId,pkg.id,pg.id,idx);
                          }else if(dragItem.type==="group"){
                            if(dragItem.pkgId===pkg.id&&dragItem.pgId===pg.id){ clearDrag(); return; }
                            moveGroupToPosition(dragItem.pkgId,dragItem.pgId,pkg.id,pg.id,"before");
                          }
                          clearDrag();
                        }}
                      >
                        <input type="checkbox" checked={selState.isSelected(pg.id)} disabled={selState.isDisabled("priceGroup")} onChange={()=>selState.toggle("priceGroup",pg.id)} style={{...S.chk(selState.isDisabled("priceGroup")),accentColor:"#fff"}}/>
                        <input style={S.flatRowInputLight} value={pg.name} onChange={e=>updatePg(pkg.id,pg.id,{name:e.target.value})}/>
                        <button style={S.flatMiniBtn()} onClick={()=>addLine(pkg.id,pg.id,"primary")}>+ Primary</button>
                        <button style={S.flatMiniBtn("#78909c")} onClick={()=>addLine(pkg.id,pg.id,"supporting")}>+ Supporting</button>
                        <button style={S.flatMiniBtn("#4b5563")} onClick={()=>addLine(pkg.id,pg.id,"note")}>+ Notes</button>
                        <div style={S.flatMoveCell}>
                          <span
                            style={{...S.flatDragHandle,color:"#355f8a"}}
                            draggable
                            onDragStart={e=>onGroupDragStart(e,pkg.id,pg.id)}
                            onDragEnd={clearDrag}
                            title="Drag group"
                          >
                            ::
                          </span>
                          <button style={S.flatMoveBtn} onClick={()=>movePriceGroup(pkg.id,pg.id,-1)} title="Move group up">▲</button>
                          <button style={S.flatMoveBtn} onClick={()=>movePriceGroup(pkg.id,pg.id,1)} title="Move group down">▼</button>
                        </div>
                      </div>
                      <div style={S.flatLineWrap}>
                        {visibleLines.map(line=>(
                          <FlatSheetLineRow
                            key={line.id}
                            line={line}
                            onChange={upd=>updateLine(pkg.id,pg.id,line.id,upd)}
                            onDelete={()=>deleteLine(pkg.id,pg.id,line.id)}
                            onMoveUp={()=>moveLine(pkg.id,pg.id,line.id,-1)}
                            onMoveDown={()=>moveLine(pkg.id,pg.id,line.id,1)}
                            onDragStart={e=>onLineDragStart(e,pkg.id,pg.id,line.id)}
                            onDragEnd={clearDrag}
                            onDragOver={e=>allowDrop(e,"line",{type:"line-before",pkgId:pkg.id,pgId:pg.id,lineId:line.id})}
                            onDropBefore={e=>{
                              if(!dragItem||dragItem.type!=="line")return;
                              e.preventDefault();
                              const idx=pg.lineItems.findIndex(l=>l.id===line.id);
                              moveLineToIndex(dragItem.pkgId,dragItem.pgId,dragItem.lineId,pkg.id,pg.id,idx);
                              clearDrag();
                            }}
                            isDropBeforeTarget={dropHint&&dropHint.type==="line-before"&&dropHint.pkgId===pkg.id&&dropHint.pgId===pg.id&&dropHint.lineId===line.id}
                            showDescription={line.role!=="supporting"&&(Object.prototype.hasOwnProperty.call(descOverrides,line.id)?descOverrides[line.id]:descDefaultOpen)}
                            onToggleDescription={()=>toggleDescription(line.id)}
                            mfrListId={mfrListId}
                            equipmentListId={equipmentListId}
                            selected={selState.isSelected(line.id)}
                            disabled={selState.isDisabled(line.isNote?"note":"line")}
                            onToggle={()=>selState.toggle(line.isNote?"note":"line",line.id)}
                            isDragActive={!!dragItem}
                          />
                        ))}
                        {dragItem?.type==="line"&&(
                          <div
                            style={isGroupEndDropTarget?S.flatEndDropZoneActive:S.flatEndDropZone}
                            onDragOver={e=>allowDrop(e,"line",{type:"line-end",pkgId:pkg.id,pgId:pg.id})}
                            onDrop={e=>{
                              if(!dragItem||dragItem.type!=="line")return;
                              e.preventDefault();
                              const idx=pg.lineItems.length;
                              moveLineToIndex(dragItem.pkgId,dragItem.pgId,dragItem.lineId,pkg.id,pg.id,idx);
                              clearDrag();
                            }}
                          >
                            Drop line at end of this price group
                          </div>
                        )}
                        {visibleLines.length===0&&<div style={{...S.focusNoSel,padding:"8px 6px"}}>No matching lines in this price group.</div>}
                      </div>
                      <div style={S.flatPgTotalBox}>
                        <div style={S.flatPgTotalLeft}>
                          <span style={S.flatPgTotalLabel}>Total Net Price, Freight Included</span>
                          <button style={S.flatMiniBtn("#2e7d32")} onClick={()=>addOptional(pkg.id,pg.id,"ADD")}>+ Adder</button>
                          <button style={S.flatMiniBtn("#c62828")} onClick={()=>addOptional(pkg.id,pg.id,"DEDUCT")}>+ Deduct</button>
                        </div>
                        <span style={S.flatPgTotalValue}>{fmt(pgTotal)}</span>
                      </div>
                      {optionals.map(ad=>(
                        <FlatAddDeductSection
                          key={ad.id}
                          ad={ad}
                          isOpen={Object.prototype.hasOwnProperty.call(adOpen,ad.id)?adOpen[ad.id]:false}
                          onToggleOpen={()=>toggleOptionalOpen(ad.id)}
                          onUpdate={updated=>updateOptional(pkg.id,pg.id,ad.id,updated)}
                          onDelete={()=>deleteOptional(pkg.id,pg.id,ad.id)}
                          onAddLine={()=>addOptionalLine(pkg.id,pg.id,ad.id)}
                          onUpdateLine={(lineId,updated)=>updateOptionalLine(pkg.id,pg.id,ad.id,lineId,updated)}
                          onDeleteLine={lineId=>deleteOptionalLine(pkg.id,pg.id,ad.id,lineId)}
                          mfrListId={mfrListId}
                          equipmentListId={equipmentListId}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderStyledText(text){
  if(!text)return "";
  const out=[];
  const re=/(\*\*[^*]+\*\*|__[^_]+__)/g;
  let last=0;
  let idx=0;
  let m;
  while((m=re.exec(text))!==null){
    if(m.index>last)out.push(<span key={`p-${idx++}`}>{text.slice(last,m.index)}</span>);
    const token=m[0];
    if(token.startsWith("**"))out.push(<strong key={`b-${idx++}`}>{token.slice(2,-2)}</strong>);
    else out.push(<span key={`u-${idx++}`} style={{textDecoration:"underline"}}>{token.slice(2,-2)}</span>);
    last=m.index+token.length;
  }
  if(last<text.length)out.push(<span key={`p-${idx++}`}>{text.slice(last)}</span>);
  return out.length?out:text;
}

// ── Quote Preview ──────────────────────────────────────────
function PreviewView({data}){
  const totalPages=data.packages.length;
  return(<div>
    {data.packages.map((pkg,pi)=>(
      <div key={pkg.id} style={S.qPage}>
        <div style={S.qHdr}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div>
              <div style={S.qTitle}>QUOTATION <span style={{fontSize:14,fontWeight:400,color:"#666"}}>pg.{pi+1} of {totalPages}</span></div>
              <div style={S.qName}>{data.quoteName}</div>
            </div>
            <div style={{fontSize:22,fontWeight:900,color:"#E46B03"}}>SVL<span style={{fontSize:10,verticalAlign:"super"}}>®</span></div>
          </div>
          <div style={S.qInfo}>
            <div style={{lineHeight:1.6}}><div><strong>Project:</strong> {data.projectName}</div><div><strong>Location:</strong> {data.location}</div></div>
            <div style={{lineHeight:1.6}}><div><strong>Bid Date:</strong> {data.bidDate}</div><div><strong>Quote #:</strong> {data.quoteNumber}</div><div><strong>Addendums:</strong> {data.addendums}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",marginTop:8,fontSize:11,color:"#555",lineHeight:1.5}}>
            <div><div><strong>Contact:</strong> Projects@svl.com 651-481-8000 SVL.com</div><div><strong>Sales Engineer:</strong> {data.salesEngineer}</div><div><strong>Project Engineer:</strong> {data.projectEngineer}</div></div>
            <div><div><strong>Date:</strong> {data.date}</div><div><strong>To:</strong> {data.to}</div><div><strong>Engineer:</strong> {data.engineer}</div></div>
          </div>
        </div>
        <div style={S.qBanner}>{pkg.name}</div>
        {pkg.priceGroups.map(pg=>{
          const pgBid=sumLines(pg.lineItems).bidPrice;
          return(<div key={pg.id}>
            <div style={S.qPgH}>{pg.name}</div>
            {pg.lineItems.filter(l=>l.role==="primary"||l.isNote).map(line=>{
              if(line.isNote){
                const noteBullets=String(line.noteText||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
                if(noteBullets.length===0)return null;
                return(<div key={line.id} style={{marginTop:4,marginBottom:4}}>
                  <div style={{...S.qBullet,fontWeight:800}}>NOTES:</div>
                  {noteBullets.map((n,i)=><div key={`n-${i}`} style={{...S.qBullet,fontWeight:800}}>• {renderStyledText(n)}</div>)}
                </div>);
              }
              const pri=line;
              const bullets=pri.description?pri.description.split(/\n|\s*\|\s*/).filter(b=>b.trim()):[];
              return(<div key={pri.id} style={S.qEquip}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontWeight:700,fontSize:13}}><strong>({pri.qty})</strong> {pri.manufacturer} {pri.model||pri.equipment}{bullets.length>0?" with:":""}</div>
                  {pri.tag&&<div style={{fontWeight:700,fontSize:12}}>TAG: {pri.tag}</div>}
                </div>
                {bullets.map((b,i)=><div key={i} style={S.qBullet}>• {renderStyledText(b)}</div>)}
              </div>);
            })}
            <div style={S.qTotal}>
              <span>TOTAL NET PRICE, STANDARD BUILD, FREIGHT ALLOWED</span>
              <span>$ {pgBid.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
            {(pg.addDeducts||[]).filter(ad=>ad.description&&ad.lineItems.length>0).map(ad=>{
              const adTotal=sumLines(ad.lineItems).bidPrice;
              return(<div key={ad.id} style={S.qAD(ad.type)}>
                <span>{ad.description}</span>
                <span>{ad.type==="DEDUCT"?"<":""}${adTotal.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}{ad.type==="DEDUCT"?">":""}</span>
              </div>);
            })}
          </div>);
        })}
        <div style={S.qDisclaim}>
          <strong>DISCLAIMERS:</strong> Sales and use taxes NOT included. Goods will conform to APPROVED/REVIEWED submittals. Quotes are valid for 30 days.
          &nbsp;&nbsp;&nbsp;<strong>ALL SALES ARE SUBJECT TO SVL'S TERMS &amp; CONDITIONS OF SALE</strong> https://www.svl.com/terms-and-conditions/
        </div>
      </div>
    ))}
  </div>);
}

// ── App ────────────────────────────────────────────────────
export default function App(){
  const startingDraft=useMemo(()=>loadDraft(),[]);
  const [data,setData]=useState(()=>startingDraft?.data||sampleData());
  const [lastSavedAt,setLastSavedAt]=useState(startingDraft?.savedAt||null);
  const [isDirty,setIsDirty]=useState(false);
  const [lastDeletedSnapshot,setLastDeletedSnapshot]=useState(null);
  const [clock,setClock]=useState(Date.now());
  const [view,setView]=useState("builderClassic");
  const selState=useSelection();
  const setDataDirty=useCallback((next)=>{
    setData(prev=>typeof next==="function"?next(prev):next);
    setIsDirty(true);
  },[]);
  const persistDraft=useCallback((source)=>{
    const stamp=saveDraft(source||data);
    if(stamp){
      setLastSavedAt(stamp);
      setIsDirty(false);
    }
  },[data]);
  const restoreSavedDraft=useCallback(()=>{
    const draft=loadDraft();
    if(!draft)return;
    setData(draft.data);
    setLastSavedAt(draft.savedAt||Date.now());
    setIsDirty(false);
    setLastDeletedSnapshot(null);
    selState.clear();
  },[selState]);
  const resetQuote=useCallback(()=>{
    if(typeof window!=="undefined"&&!window.confirm("Load the default sample quote? Unsaved changes in the current quote will be replaced."))return;
    setData(sampleData());
    setIsDirty(true);
    setLastDeletedSnapshot(null);
    selState.clear();
  },[selState]);
  const newEmptyQuote=useCallback(()=>{
    if(typeof window!=="undefined"&&!window.confirm("Start a blank quote? Unsaved changes in the current quote will be replaced."))return;
    setData(emptyQuote());
    setIsDirty(true);
    setLastDeletedSnapshot(null);
    selState.clear();
  },[selState]);

  useEffect(()=>{
    if(!isDirty)return;
    const t=setTimeout(()=>persistDraft(data),900);
    return()=>clearTimeout(t);
  },[data,isDirty,persistDraft]);
  useEffect(()=>{
    const t=setInterval(()=>setClock(Date.now()),15000);
    return()=>clearInterval(t);
  },[]);

  const saveLabel=useMemo(()=>{
    if(isDirty)return "Unsaved changes";
    if(!lastSavedAt)return "Not saved yet";
    const elapsed=Math.max(0,Math.floor((clock-lastSavedAt)/1000));
    if(elapsed<5)return "Saved just now";
    if(elapsed<60)return `Saved ${elapsed}s ago`;
    const mins=Math.floor(elapsed/60);
    if(mins<60)return `Saved ${mins}m ago`;
    const hrs=Math.floor(mins/60);
    return `Saved ${hrs}h ago`;
  },[clock,isDirty,lastSavedAt]);

  const handleBulkDelete=()=>{
    if(selState.sel.ids.length===0)return;
    if(typeof window!=="undefined"&&!window.confirm(`Delete ${selState.sel.ids.length} selected ${TYPE_LABELS[selState.sel.type]||"items"}?`))return;
    const snapshot=cloneQuoteData(data);
    const ids=new Set(selState.sel.ids);
    const type=selState.sel.type;
    let d={...data};
    if(type==="package"){
      const surviving=d.packages.filter(p=>!ids.has(p.id));
      const orphanPGs=d.packages.filter(p=>ids.has(p.id)).flatMap(p=>p.priceGroups);
      if(surviving.length===0&&orphanPGs.length>0){
        d.packages=[{id:gid(),name:"Unassigned",type:"Custom",priceGroups:orphanPGs}];
      }else if(surviving.length>0&&orphanPGs.length>0){
        surviving[0]={...surviving[0],priceGroups:[...surviving[0].priceGroups,...orphanPGs]};
        d.packages=surviving;
      }else{d.packages=surviving;}
    }else if(type==="priceGroup"){
      d.packages=d.packages.map(p=>({...p,priceGroups:p.priceGroups.filter(pg=>!ids.has(pg.id))}));
    }else if(type==="line"||type==="note"){
      d.packages=d.packages.map(p=>({...p,priceGroups:p.priceGroups.map(pg=>({...pg,lineItems:pg.lineItems.filter(l=>!ids.has(l.id))}))}));
    }else if(type==="addDeduct"){
      d.packages=d.packages.map(p=>({...p,priceGroups:p.priceGroups.map(pg=>({...pg,addDeducts:(pg.addDeducts||[]).filter(ad=>!ids.has(ad.id))}))}));
    }else if(type==="adLine"){
      d.packages=d.packages.map(p=>({...p,priceGroups:p.priceGroups.map(pg=>({...pg,addDeducts:(pg.addDeducts||[]).map(ad=>({...ad,lineItems:ad.lineItems.filter(l=>!ids.has(l.id))}))}))}));
    }
    setLastDeletedSnapshot(snapshot);
    setDataDirty(d);
    selState.clear();
  };
  const handleBulkCopy=()=>{
    if(selState.sel.ids.length===0)return;
    const ids=new Set(selState.sel.ids);
    const type=selState.sel.type;
    let d={...data};
    if(type==="line"||type==="note"){
      d.packages=d.packages.map(p=>({...p,priceGroups:p.priceGroups.map(pg=>{
        const newItems=[];
        pg.lineItems.forEach(l=>{
          newItems.push(l);
          if(ids.has(l.id)){
            const clone={...l,id:gid(),groupId:gid()};
            newItems.push(clone);
          }
        });
        return newItems.length!==pg.lineItems.length?{...pg,lineItems:newItems}:pg;
      })}));
    }else if(type==="priceGroup"){
      d.packages=d.packages.map(p=>{
        const newGroups=[];
        p.priceGroups.forEach(pg=>{
          newGroups.push(pg);
          if(ids.has(pg.id)){
            const clone={...pg,id:gid(),lineItems:(pg.lineItems||[]).map(l=>({...l,id:gid(),groupId:l.isNote?l.groupId:gid()})),addDeducts:(pg.addDeducts||[]).map(ad=>({...ad,id:gid(),lineItems:(ad.lineItems||[]).map(l=>({...l,id:gid(),groupId:gid()}))}))};
            newGroups.push(clone);
          }
        });
        return newGroups.length!==p.priceGroups.length?{...p,priceGroups:newGroups}:p;
      });
    }
    setDataDirty(d);
    selState.clear();
  };
  const undoDelete=()=>{
    if(!lastDeletedSnapshot)return;
    setData(cloneQuoteData(lastDeletedSnapshot));
    setLastDeletedSnapshot(null);
    setIsDirty(true);
    selState.clear();
  };

  return(
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={S.title}>SVL ONE — Quote Builder</div>
        <div style={{fontSize:12,color:"#888"}}>Prototype v7 — Classic + Focused + Flat Sheet UX</div>
      </div>
      <div style={S.utilBar}>
        <div style={S.utilLeft}>
          <button style={S.btn("#0058A4",12)} onClick={()=>persistDraft(data)}>Save Now</button>
          <button style={S.btnO("#666")} onClick={restoreSavedDraft}>Reload Saved</button>
          <button style={S.btnO("#a45100")} onClick={newEmptyQuote}>New Quote</button>
          <button style={S.btnO("#666")} onClick={resetQuote}>Default Quote</button>
          {lastDeletedSnapshot&&<button style={S.btnO("#c62828")} onClick={undoDelete}>Undo Last Delete</button>}
        </div>
        <div style={S.utilRight}>
          <span style={S.utilPill(!isDirty)}>{saveLabel}</span>
        </div>
      </div>
      <div style={S.tabs}>
        <div style={S.tab(view==="builderClassic")} onClick={()=>{selState.clear();setView("builderClassic");}}>Classic Builder</div>
        <div style={S.tab(view==="builderFocused")} onClick={()=>{selState.clear();setView("builderFocused");}}>Focused Sheet</div>
        <div style={S.tab(view==="builderFlat")} onClick={()=>{selState.clear();setView("builderFlat");}}>Flat Sheet</div>
        <div style={S.tab(view==="preview")} onClick={()=>{selState.clear();setView("preview");}}>Generated Quote</div>
      </div>
      {view==="builderClassic"&&<BuilderView data={data} setData={setDataDirty} selState={selState}/>}
      {view==="builderFocused"&&<FocusedBuilderView data={data} setData={setDataDirty}/>}
      {view==="builderFlat"&&<FlatSheetBuilderView data={data} setData={setDataDirty} selState={selState}/>}
      {view==="preview"&&<PreviewView data={data}/>}
      {view==="builderClassic"&&<ActionBar sel={selState.sel} onDelete={handleBulkDelete} onClear={selState.clear} onCopy={handleBulkCopy}/>}
      {view==="builderFlat"&&<ActionBar sel={selState.sel} onDelete={handleBulkDelete} onClear={selState.clear} onCopy={handleBulkCopy}/>}
    </div>
  );
}
