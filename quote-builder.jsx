import { useState, useCallback, useEffect, useMemo } from "react";

const gid = () => Math.random().toString(36).substr(2, 9);
const moveItem = (arr, idx, dir) => {
  const n = idx + dir;
  if (n < 0 || n >= arr.length) return arr;
  const c = [...arr]; [c[idx], c[n]] = [c[n], c[idx]]; return c;
};

const CATEGORIES = ["Vent", "Heat", "Hydro", "TC", "Misc"];
const PKG_TYPES = ["Building", "Phase", "Alternate", "Custom"];
const STORAGE_KEY = "svl_quote_builder_v4";

const EMPTY_LINE = {
  id: "", role: "primary", groupId: "",
  qty: 1, manufacturer: "", equipment: "", model: "",
  list: 0, dollarUp: 0, multi: 1, pay: 0,
  freight: 0, mu: 1.35, notes: "", status: ".", category: "Vent",
  description: "", tag: "",
};

const calc = (l) => {
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
  return { mfgNet: a.mfgNet + c.mfgNet, mfgComm: a.mfgComm + c.mfgComm, totalNet: a.totalNet + c.totalNet, bidPrice: a.bidPrice + c.bidPrice, comm: a.comm + c.comm, freight: a.freight + l.freight };
}, { mfgNet: 0, mfgComm: 0, totalNet: 0, bidPrice: 0, comm: 0, freight: 0 });

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
  inpSm:{padding:"3px 5px",border:"1px solid #ccc",borderRadius:3,fontSize:12,width:"100%",boxSizing:"border-box",textAlign:"right"},
  inpSmL:{padding:"3px 5px",border:"1px solid #ccc",borderRadius:3,fontSize:12,width:"100%",boxSizing:"border-box"},
  btn:(c="#0058A4",sz=13)=>({padding:`${sz>12?8:5}px ${sz>12?16:10}px`,background:c,color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontWeight:600,fontSize:sz,whiteSpace:"nowrap"}),
  btnO:(c="#0058A4")=>({padding:"5px 10px",background:"#fff",color:c,border:`1.5px solid ${c}`,borderRadius:4,cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap"}),
  pkg:{border:"2px solid #0058A4",borderRadius:8,marginBottom:20,overflow:"hidden"},
  pkgH:{background:"#0058A4",color:"#fff",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"},
  pkgHInp:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)",color:"#fff",padding:"5px 8px",borderRadius:4,fontWeight:700,fontSize:15},
  pkgHSel:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)",color:"#fff",padding:"4px 6px",borderRadius:4,fontSize:12},
  pgBlk:{border:"1px solid #ddd",borderRadius:6,margin:"10px 12px",overflow:"hidden"},
  pgH:{background:"#e9eef5",padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #ddd",gap:8,flexWrap:"wrap"},
  gridCols:"28px 70px 44px 110px 110px 100px 80px 82px 48px 52px 44px 82px 68px 58px 82px 48px 74px 86px 100px 56px",
  lineHdr:{fontSize:10,fontWeight:700,color:"#777",textTransform:"uppercase",padding:"4px 4px",borderBottom:"2px solid #ccc",background:"#fafafa"},
  lineRow:(role,sel)=>({padding:"3px 4px",borderBottom:"1px solid #eee",background:sel?"#fff3e0":role==="supporting"?"#f7f9fc":"#fff",borderLeft:sel?"3px solid #E46B03":role==="supporting"?"3px solid #7bafd4":"3px solid transparent",alignItems:"center"}),
  calcCell:{fontSize:12,fontWeight:600,textAlign:"right",padding:"0 2px",color:"#333",overflow:"hidden"},
  calcCellBlue:{fontSize:12,fontWeight:700,textAlign:"right",padding:"0 2px",color:"#0058A4"},
  calcCellGreen:{fontSize:12,fontWeight:700,textAlign:"right",padding:"0 2px",color:"#2e7d32"},
  badge:(r)=>({display:"inline-block",padding:"1px 5px",borderRadius:3,fontSize:9,fontWeight:700,background:r==="primary"?"#0058A4":"#78909c",color:"#fff",cursor:"pointer"}),
  subtotal:{display:"grid",padding:"6px 4px",borderTop:"2px solid #0058A4",background:"#f0f4fa",fontWeight:700,fontSize:12},
  descToggle:{fontSize:10,color:"#0058A4",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",padding:"1px 4px"},
  descArea:{width:"calc(100% - 80px)",marginLeft:73,padding:"4px 6px",border:"1px solid #ccc",borderRadius:3,fontSize:11,fontFamily:"inherit",resize:"vertical",minHeight:36,marginBottom:4},
  adBlk:{border:"2px dashed",borderRadius:6,margin:"8px 12px",overflow:"hidden"},
  adH:(t,sel)=>({background:sel?"#fff3e0":t==="ADD"?"#e8f5e9":"#fbe9e7",padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${t==="ADD"?"#a5d6a7":"#ef9a9a"}`,gap:8,flexWrap:"wrap"}),
  adBadge:(t)=>({display:"inline-block",padding:"2px 8px",borderRadius:3,fontSize:11,fontWeight:800,background:t==="ADD"?"#2e7d32":"#c62828",color:"#fff",cursor:"pointer"}),
  chk:(dis)=>({width:16,height:16,cursor:dis?"not-allowed":"pointer",opacity:dis?0.3:1,accentColor:"#E46B03",flexShrink:0}),
  actionBar:{position:"fixed",bottom:0,left:0,right:0,background:"#1a1a2e",color:"#fff",padding:"12px 24px",display:"flex",justifyContent:"center",alignItems:"center",gap:20,zIndex:1000,boxShadow:"0 -4px 20px rgba(0,0,0,0.3)",fontSize:14},
  qPage:{background:"#fff",maxWidth:850,margin:"0 auto 24px",border:"1px solid #bbb",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
  qHdr:{padding:"20px 28px 14px",borderBottom:"2px solid #0058A4"},
  qTitle:{fontSize:28,fontWeight:900,color:"#0058A4"},
  qName:{fontSize:14,fontWeight:700,color:"#E46B03",marginTop:2},
  qInfo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:10,fontSize:12},
  qBanner:{background:"linear-gradient(90deg,#0058A4 0%,#E46B03 100%)",color:"#fff",textAlign:"center",padding:"7px 16px",fontWeight:800,fontSize:13,textTransform:"uppercase",letterSpacing:2},
  qPgH:{background:"#0058A4",color:"#fff",padding:"5px 28px",fontWeight:700,fontSize:12,textTransform:"uppercase"},
  qEquip:{padding:"10px 28px 6px",borderBottom:"1px solid #eee"},
  qBullet:{fontSize:12,color:"#444",margin:"1px 0 1px 18px"},
  qTotal:{display:"flex",justifyContent:"space-between",padding:"8px 28px",fontWeight:800,fontSize:13,borderTop:"2px solid #333"},
  qAD:(t)=>({display:"flex",justifyContent:"space-between",padding:"4px 28px",fontWeight:700,fontSize:12,color:t==="ADD"?"#2e7d32":"#c62828"}),
  qDisclaim:{background:"#f5f5f5",padding:"10px 28px",fontSize:10,color:"#777",borderTop:"1px solid #ddd",marginTop:12},
};

const TYPE_LABELS={line:"Line Items",priceGroup:"Price Groups",package:"Packages",addDeduct:"Add/Deducts",adLine:"Add/Deduct Lines"};
const colHeaders=["","Role","Qty","Manufacturer","Equipment","Model","Tag","List","$↑%","Multi","Pay%","Mfg Net","Mfg Comm","Freight","Total Net","MU","Commission","Bid Price","Notes","Cat"];

// ── Line Item Row ──────────────────────────────────────────
function LineRow({line,onChange,onMove,selected,disabled,onToggle}){
  const c=calc(line);
  const u=(k,v)=>onChange({...line,[k]:v});
  const [showDesc,setShowDesc]=useState(false);
  const la={background:"none",border:"1px solid #ddd",color:"#999",borderRadius:2,cursor:"pointer",fontSize:9,padding:"1px 4px",fontWeight:700};
  return(<>
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
      <input style={S.inpSmL} value={line.notes} onChange={e=>u("notes",e.target.value)} placeholder="Notes"/>
      <select style={{...S.inpSmL,fontSize:10,padding:2}} value={line.category} onChange={e=>u("category",e.target.value)}>
        {CATEGORIES.map(ct=><option key={ct} value={ct}>{ct}</option>)}
      </select>
    </div>
    <div style={{paddingLeft:73,paddingBottom:2}}>
      <button style={S.descToggle} onClick={()=>setShowDesc(!showDesc)}>
        {showDesc?"▾ hide description":"▸ description"+(line.description?" ✓":"")}
      </button>
    </div>
    {showDesc&&<textarea style={S.descArea} value={line.description} rows={3} onChange={e=>u("description",e.target.value)} placeholder="Equipment specs / bullet points (one per line)"/>}
  </>);
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
            <div></div><div></div>
          </div>
        </div>
      </div>
      <div style={{padding:"8px 12px",display:"flex",gap:6}}>
        <button style={S.btnO()} onClick={()=>addLine("primary")}>+ Primary Line</button>
        <button style={S.btnO("#78909c")} onClick={()=>addLine("supporting")}>+ Supporting Line</button>
      </div>
      {(pg.addDeducts||[]).map(ad=>(
        <AddDeductSection key={ad.id} ad={ad} onUpdate={upd=>updAD(ad.id,upd)}
          selected={selState.isSelected(ad.id)} disabled={adDisabled}
          onToggle={()=>selState.toggle("addDeduct",ad.id)} selState={selState}/>
      ))}
      <div style={{padding:"4px 12px 10px",display:"flex",gap:6}}>
        <button style={S.btnO("#2e7d32")} onClick={()=>addAD("ADD")}>+ Add Alternate</button>
        <button style={S.btnO("#c62828")} onClick={()=>addAD("DEDUCT")}>+ Deduct Alternate</button>
      </div>
    </div>
  );
}

// ── Action Bar ─────────────────────────────────────────────
function ActionBar({sel,onDelete,onClear}){
  if(sel.ids.length===0)return null;
  return(
    <div style={S.actionBar}>
      <span style={{fontWeight:700,fontSize:15}}>{sel.ids.length} {TYPE_LABELS[sel.type]||sel.type} selected</span>
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
          const pris=pg.lineItems.filter(l=>l.role==="primary");
          const pgBid=sumLines(pg.lineItems).bidPrice;
          return(<div key={pg.id}>
            <div style={S.qPgH}>{pg.name}</div>
            {pris.map(pri=>{
              const bullets=pri.description?pri.description.split("\n").filter(b=>b.trim()):[];
              return(<div key={pri.id} style={S.qEquip}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontWeight:700,fontSize:13}}><strong>({pri.qty})</strong> {pri.manufacturer} {pri.model||pri.equipment}{bullets.length>0?" with:":""}</div>
                  {pri.tag&&<div style={{fontWeight:700,fontSize:12}}>TAG: {pri.tag}</div>}
                </div>
                {bullets.map((b,i)=><div key={i} style={S.qBullet}>• {b}</div>)}
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
  const [view,setView]=useState("builder");
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
    if(typeof window!=="undefined"&&!window.confirm("Start a new quote? Unsaved changes in the current quote will be replaced."))return;
    setData(sampleData());
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
    }else if(type==="line"){
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
        <div style={{fontSize:12,color:"#888"}}>Prototype v5 — Draft Save, Collapse, Safer Deletes</div>
      </div>
      <div style={S.utilBar}>
        <div style={S.utilLeft}>
          <button style={S.btn("#0058A4",12)} onClick={()=>persistDraft(data)}>Save Now</button>
          <button style={S.btnO("#666")} onClick={restoreSavedDraft}>Reload Saved</button>
          <button style={S.btnO("#a45100")} onClick={resetQuote}>New Quote</button>
          {lastDeletedSnapshot&&<button style={S.btnO("#c62828")} onClick={undoDelete}>Undo Last Delete</button>}
        </div>
        <div style={S.utilRight}>
          <span style={S.utilPill(!isDirty)}>{saveLabel}</span>
        </div>
      </div>
      <div style={S.tabs}>
        <div style={S.tab(view==="builder")} onClick={()=>setView("builder")}>Quote Builder</div>
        <div style={S.tab(view==="preview")} onClick={()=>setView("preview")}>Generated Quote</div>
      </div>
      {view==="builder"?<BuilderView data={data} setData={setDataDirty} selState={selState}/>:<PreviewView data={data}/>}
      <ActionBar sel={selState.sel} onDelete={handleBulkDelete} onClear={selState.clear}/>
    </div>
  );
}
