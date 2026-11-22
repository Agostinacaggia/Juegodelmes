import { getStore } from '@netlify/blobs';
const names=['Mili','Rena','Delfi','Valen','Guada','Agos'];
const initial=()=>({step:0,showResults:false,votes:{},players:[]});
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async (request)=>{
 try{
 const store=getStore('odiadas-live-v1');let state=await store.get('room',{type:'json'})||initial();
 if(request.method==='GET')return reply(state);
 if(request.method!=='POST')return reply({error:'Método no permitido'},405);
 const body=await request.json();const pin=process.env.ADMIN_PIN;
 if(!pin)return reply({error:'Falta configurar ADMIN_PIN en Netlify.'},503);
 if(body.action==='auth')return body.pin===pin?reply({ok:true}):reply({error:'Clave incorrecta'},403);
 if(['step','results','reset'].includes(body.action)){
 if(body.pin!==pin)return reply({error:'Solo Agos puede controlar el juego'},403);
 if(body.action==='reset')state=initial();
 if(body.action==='step'){const step=Number(body.step);if(!Number.isInteger(step)||step<0||step>16)return reply({error:'Pantalla inválida'},400);state.step=step;state.showResults=false}
 if(body.action==='results')state.showResults=!!body.showResults;
 }else if(body.action==='vote'){
 if(!names.includes(body.name)||body.name==='Agos')return reply({error:'Jugadora inválida'},400);
 const step=Number(body.step);if(step!==state.step||step<1||step>14)return reply({error:'Esta ronda ya terminó'},409);
 const allowed=step<=5||[9,10,11].includes(step)?names:({6:['Rena','Agos','Las dos, obvio','Ninguna, profesionales'],7:['Delfi','Mili','Las dos','Ninguna, son un amor'],8:['Guada','Valen','Las dos','Jamás pasaría'],12:['Se casa / se pone de novia','Cambia de trabajo','Se va de viaje largo','Algo que nadie está imaginando'],13:['Nivel chisme de vestuario','Nivel reunión de emergencia','Nivel «pará, ¿QUÉ?»','Nivel Pablo pide tiempo muerto'],14:['Su estado civil','Su trabajo','Su código postal','Nos está boludeando a todas']})[step];
 if(!allowed?.includes(body.value))return reply({error:'Voto inválido'},400);
 state.votes[String(step)]??={};if(state.votes[String(step)][body.name])return reply({error:'Ya votaste en esta ronda'},409);
 state.votes[String(step)][body.name]=body.value;
 if(!state.players.includes(body.name))state.players.push(body.name);
 }else return reply({error:'Acción desconocida'},400);
 await store.setJSON('room',state);return reply(state);
 }catch(e){console.error(e);return reply({error:'Error de servidor. Revisá la configuración de Netlify Blobs.'},500)}
};
