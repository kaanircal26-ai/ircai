import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { API_BASE_URL, getSupabase, initializeSupabase } from './src/supabase';
import { C } from './src/theme';

const STORE = { tasks: 'tasks.v2', notes: 'notes.v2', week: 'week.v2', chat: 'chat.v2', projects: 'projects.v2', calendar: 'calendar.v2', memories: 'memories.v2', profileAvatar: 'profile-avatar.v1', connectFollowing: 'connect-following.v1' };
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const TABS = [
  ['home','Ana sayfa','grid-outline','grid'], ['chat','Sohbet','chatbubble-ellipses-outline','chatbubble-ellipses'],
  ['projects','Projeler','folder-open-outline','folder-open'], ['studio','Studio','color-wand-outline','color-wand'],
  ['tasks','Takvim','calendar-outline','calendar'], ['web','TOZRA Web','globe-outline','globe'], ['connect','Connect','people-outline','people'], ['profile','Hesap','person-circle-outline','person-circle']
];
const MODES = {
  idea: { title:'Fikir geliştirme', icon:'bulb-outline', instruction:'Yaratıcı stratejist gibi çalış. Fikri netleştir, problem ve fırsatı tanımla, 3 özgün konsept öner, en güçlü konsepti gerekçelendir ve uygulanabilir yaratıcı yol haritası çıkar.' },
  image: { title:'Görsel stüdyo', icon:'image-outline', instruction:'Sanat yönetmeni ve görsel konsept tasarımcısı gibi çalış. Kompozisyon, kadraj, ışık, renk paleti, materyal ve atmosferi tanımla. Görsel üretimi için güçlü bir prompt ve negatif prompt hazırla.' },
  video: { title:'Video stüdyo', icon:'videocam-outline', instruction:'Video kreatif direktörü ve senarist gibi çalış. Hedef, süre, format, açılış kancası, sahne sahne storyboard, kamera/kurgu notları, ses ve ekran yazılarını hazırla. Prodüksiyon planı ver; doğrudan video render ettiğini iddia etme.' },
  brand: { title:'Marka tasarımı', icon:'aperture-outline', instruction:'Marka danışmanı gibi çalış. Konumlandırma, kişilik, logo yönü, renk paleti, tipografi, görsel sistem ve kullanım örneklerinden oluşan profesyonel brief hazırla.' },
  content: { title:'İçerik üretimi', icon:'document-text-outline', instruction:'Profesyonel içerik yazarı ve editör gibi çalış. Amaç ve hedef kitleye göre güçlü içerik üret; gerektiğinde başlık alternatifleri ve yayın kontrol listesi ekle.' },
  campaign: { title:'Kampanya', icon:'megaphone-outline', instruction:'Kreatif kampanya stratejisti gibi çalış. Amaç, hedef kitle, içgörü, ana fikir, slogan, kanal stratejisi, içerik serisi, yayın akışı ve başarı göstergelerini hazırla.' }
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const prettyDate = (d) => { try { return new Date(`${d}T12:00:00`).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}); } catch { return d; } };
const scopedKey = (userId,key) => `tozra:${userId || 'guest'}:${key}`;

function Brand({ small=false }) { return <View style={s.brandRow}><View style={[s.brandMark,small&&{width:34,height:34,borderRadius:11}]}><Text style={[s.brandLetter,small&&{fontSize:20}]}>T</Text></View><View><Text style={[s.brandName,small&&{fontSize:18}]}>TOZRA</Text><Text style={s.brandSub}>CREATIVE INTELLIGENCE</Text></View></View>; }
function Card({children,style}) { return <View style={[s.card,style]}>{children}</View>; }
function Heading({title,hint}) { return <View style={s.heading}><Text style={s.headingText}>{title}</Text>{hint?<Text style={s.hint}>{hint}</Text>:null}</View>; }
function Field(p) { return <TextInput placeholderTextColor={C.faint} {...p} style={[s.field,p.style]} />; }
function Button({title,onPress,secondary=false,disabled=false,icon}) { return <Pressable onPress={onPress} disabled={disabled} style={[s.button,secondary&&s.buttonSecondary,disabled&&{opacity:.45}]}>{icon?<Ionicons name={icon} size={17} color={secondary?C.text:'#10150D'}/>:null}<Text style={[s.buttonText,secondary&&{color:C.text}]}>{title}</Text></Pressable>; }
function Chip({label,active,onPress}) { return <Pressable onPress={onPress} style={[s.chip,active&&s.chipActive]}><Text style={[s.chipText,active&&s.chipTextActive]}>{label}</Text></Pressable>; }
function AuthScreen({onReady}) {
  const [mode,setMode]=useState('login'),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(){ if(!email.trim()||!password)return setError('E-posta ve şifre alanlarını doldur.'); if(mode==='signup'&&password.length<6)return setError('Şifre en az 6 karakter olmalı.'); setBusy(true);setError('');try{const sb=getSupabase();if(mode==='signup'){const {data,error:e}=await sb.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()}}});if(e)throw e;if(data.session)onReady(data.session);else Alert.alert('E-posta doğrulaması','Hesabını etkinleştirmek için e-postana gönderilen bağlantıyı aç.');}else{const {data,error:e}=await sb.auth.signInWithPassword({email:email.trim(),password});if(e)throw e;onReady(data.session);}}catch(e){setError(e.message||'İşlem tamamlanamadı.');}finally{setBusy(false);} }
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.authWrap} keyboardShouldPersistTaps="handled"><Brand/><View style={{marginTop:48,marginBottom:22}}><Text style={s.eyebrow}>KİŞİSEL YARATICI ÇALIŞMA ALANIN</Text><Text style={s.authTitle}>{mode==='login'?'Yeniden hoş geldin.':'TOZRA’ya katıl.'}</Text><Text style={s.muted}>Fikirlerini, projelerini ve günlük planını tek bir yerde buluştur.</Text></View><Card><Text style={s.cardTitle}>{mode==='login'?'Hesabına giriş yap':'Yeni hesap oluştur'}</Text>{mode==='signup'?<Field placeholder="Adın" value={name} onChangeText={setName}/>:null}<Field placeholder="E-posta adresi" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/><Field placeholder="Şifre" value={password} onChangeText={setPassword} secureTextEntry/>{error?<Text style={s.error}>{error}</Text>:null}<Button title={busy?'İşleniyor…':mode==='login'?'Giriş yap':'Hesap oluştur'} onPress={submit} disabled={busy}/>{busy?<ActivityIndicator color={C.accent} style={{marginTop:12}}/>:null}<Pressable onPress={()=>{setMode(mode==='login'?'signup':'login');setError('');}} style={{padding:15,alignItems:'center'}}><Text style={s.muted}>{mode==='login'?'Hesabın yok mu? ':'Zaten hesabın var mı? '}<Text style={{color:C.accent,fontWeight:'800'}}>{mode==='login'?'Kayıt ol':'Giriş yap'}</Text></Text></Pressable></Card><Text style={s.foot}>Güvenli hesap erişimi · Supabase Auth</Text></ScrollView></SafeAreaView>;
}

async function apiChat(session,{prompt,history=[],images=[],videoFrames=[],projectContext='',personalMemory=[],agentMode=false}) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
  try { const response=await fetch(`${API_BASE_URL}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({prompt,history,images,videoFrames,projectContext,personalMemory,agentMode}),signal:controller.signal});const data=await response.json().catch(()=>({}));if(!response.ok||!data.success)throw new Error(data.error||`TOZRA yanıt veremedi (${response.status}).`);return data; }
  catch(e){if(e.name==='AbortError')throw new Error('İstek zaman aşımına uğradı. Tekrar deneyebilirsin.');throw e;} finally{clearTimeout(timer);}
}
async function chooseMedia(kind) {
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted)throw new Error('Medya kütüphanesi izni gerekli.');
  const mediaTypes=kind==='video'?['videos']:['images'];const result=await ImagePicker.launchImageLibraryAsync({mediaTypes,quality:.75,base64:kind==='image',videoMaxDuration:60});
  if(result.canceled||!result.assets?.length)return null;return result.assets[0];
}
async function mediaPayload(asset,kind) {
  if(kind==='image'){const converted=await ImageManipulator.manipulateAsync(asset.uri,[],{compress:.72,format:ImageManipulator.SaveFormat.JPEG,base64:true});if(!converted.base64)throw new Error('Görsel okunamadı.');return {kind:'image',uri:converted.uri,name:asset.fileName||'gorsel',data:`data:image/jpeg;base64,${converted.base64}`};}
  const duration=Math.max(1000,asset.duration||3000);const times=[0,Math.floor(duration/2),Math.max(0,duration-500)];const frames=[];
  for(const time of [...new Set(times)]){const thumb=await VideoThumbnails.getThumbnailAsync(asset.uri,{time,quality:.65});const base64=await FileSystem.readAsStringAsync(thumb.uri,{encoding:FileSystem.EncodingType.Base64});frames.push(`data:image/jpeg;base64,${base64}`);}
  return {kind:'video',uri:asset.uri,name:asset.fileName||'video',frames};
}


function HomeScreen({data,setData,onTab}) {
 const [newTask,setNewTask]=useState('');
 const done=data.tasks.filter(x=>x.done).length;
 const today=data.tasks.filter(x=>x.date===dateKey());
 const completion=data.tasks.length?Math.round(done/data.tasks.length*100):0;
 const dateLabel=new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'});
 function add(){const title=newTask.trim();if(!title)return;setData(v=>({...v,tasks:[{id:uid(),title,date:dateKey(),priority:'normal',done:false},...v.tasks]}));setNewTask('');}
 const modules=[
  ['chat','TOZRA AI','Fikirlerini geliştir','sparkles','moduleAI'],
  ['studio','Creative Studio','Görsel ve içerik üret','color-palette','moduleStudio'],
  ['projects','Projeler','Üretimini yönet','layers','moduleProjects'],
  ['tasks','Planlama','Görevlerini düzenle','calendar','moduleTasks'],
  ['web','TOZRA Web','Dijital deneyimler oluştur','globe','moduleWeb']
 ];
 return <ScrollView contentContainerStyle={s.newHome} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
  <View style={s.homeGreeting}>
   <View><Text style={s.homeOverline}>KİŞİSEL YARATICI ALANIN</Text><Text style={s.homeDate}>{dateLabel}</Text></View>
   <Pressable onPress={()=>onTab('profile')} style={s.homeAvatar}><Ionicons name="person-outline" size={19} color={C.text}/></Pressable>
  </View>
  <View style={s.homeHero}>
   <View style={s.heroOrbOne}/><View style={s.heroOrbTwo}/>
   <Text style={s.heroKicker}>TOZRA CREATIVE INTELLIGENCE</Text>
   <Text style={s.homeHeroTitle}>Bugün ne{"\n"}inşa ediyoruz?</Text>
   <Text style={s.homeHeroCopy}>Fikrini keşfet. Projeni geliştir. Üretimini ileri taşı.</Text>
   <Pressable onPress={()=>onTab('chat')} style={s.heroAction}>
    <Ionicons name="sparkles" size={17} color="#191714"/><Text style={s.heroActionText}>TOZRA AI ile başla</Text><Ionicons name="arrow-up-right" size={17} color="#191714"/>
   </Pressable>
   <Text style={s.heroIndex}>01 / CREATIVE WORKSPACE</Text>
  </View>
  <View style={s.metricStrip}>
   <View style={s.metricCell}><Text style={s.metricValue}>{data.projects.length.toString().padStart(2,'0')}</Text><Text style={s.metricLabel}>PROJE</Text></View>
   <View style={s.metricDivider}/>
   <View style={s.metricCell}><Text style={s.metricValue}>{data.tasks.length.toString().padStart(2,'0')}</Text><Text style={s.metricLabel}>GÖREV</Text></View>
   <View style={s.metricDivider}/>
   <View style={s.metricCell}><Text style={s.metricValue}>{completion}%</Text><Text style={s.metricLabel}>TAMAMLANMA</Text></View>
  </View>
  <View style={s.sectionHeading}><View><Text style={s.sectionEyebrow}>ÇALIŞMA ALANIN</Text><Text style={s.sectionTitle}>Keşfet ve üret</Text></View><Text style={s.sectionCount}>05 MODÜL</Text></View>
  <View style={s.moduleGrid}>
   {modules.map((m,i)=><Pressable key={m[0]} onPress={()=>onTab(m[0])} style={[s.moduleTile,i===0&&s.moduleTileFeatured]}>
    <View style={s.moduleTop}><View style={[s.moduleIcon,i===0&&s.moduleIconFeatured]}><Ionicons name={m[3]} size={20} color={i===0?'#211D17':C.accent}/></View><Ionicons name="arrow-up-right" size={17} color={C.faint}/></View>
    <Text style={s.moduleTitle}>{m[1]}</Text><Text style={s.moduleCopy}>{m[2]}</Text>
   </Pressable>)}
  </View>
  <View style={s.sectionHeading}><View><Text style={s.sectionEyebrow}>BUGÜNÜN ODAĞI</Text><Text style={s.sectionTitle}>Görevlerin</Text></View><Pressable onPress={()=>onTab('tasks')}><Text style={s.sectionLink}>Tümünü gör ↗</Text></Pressable></View>
  <View style={s.focusPanel}>
   <View style={s.focusTop}><Text style={s.focusCaption}>GÜNLÜK İLERLEME</Text><Text style={s.focusPercent}>{today.filter(x=>x.done).length}/{today.length} tamamlandı</Text></View>
   <View style={s.progressTrack}><View style={[s.progressFill,{width:`${today.length?today.filter(x=>x.done).length/today.length*100:0}%`} ]}/></View>
   <View style={s.addRow}><Field value={newTask} onChangeText={setNewTask} placeholder="Yeni bir görev ekle…" style={{flex:1,marginBottom:0}} onSubmitEditing={add}/><Pressable onPress={add} style={s.newAddButton}><Ionicons name="plus" color="#211D17" size={21}/></Pressable></View>
   {today.slice(0,4).map(t=><TaskRow key={t.id} task={t} onToggle={()=>setData(v=>({...v,tasks:v.tasks.map(z=>z.id===t.id?{...z,done:!z.done}:z)}))} onDelete={()=>setData(v=>({...v,tasks:v.tasks.filter(z=>z.id!==t.id)}))}/> )}
   {!today.length?<Text style={s.focusEmpty}>Bugün için bir görev ekleyerek başlayabilirsin.</Text>:null}
  </View>
  <View style={s.sectionHeading}><View><Text style={s.sectionEyebrow}>NOT DEFTERİ</Text><Text style={s.sectionTitle}>Aklındaki fikirler</Text></View></View>
  <View style={s.notesPanel}><Ionicons name="document-text-outline" size={19} color={C.accent}/><Field value={data.notes} onChangeText={v=>setData(old=>({...old,notes:v}))} placeholder="Fikrini kaybetme; buraya not al…" multiline style={s.notesField}/></View>
 </ScrollView>;
}

function TaskRow({task,onToggle,onDelete}) { return <View style={s.taskRow}><Pressable onPress={onToggle} style={[s.check,task.done&&s.checkDone]}>{task.done?<Ionicons name="checkmark" color="#10150D" size={13}/>:null}</Pressable><View style={{flex:1}}><Text style={[s.taskText,task.done&&{textDecorationLine:'line-through',color:C.faint}]}>{task.title}</Text>{task.date?<Text style={s.smallMuted}>{prettyDate(task.date)} · {task.priority==='high'?'Öncelikli':'Normal'}</Text>:null}</View><Pressable onPress={onDelete}><Ionicons name="close" color={C.faint} size={18}/></Pressable></View>; }

function ChatScreen({session,data,setData,initialPrompt,setInitialPrompt,projectContext}) {
 const [messages,setMessages]=useState(data.chat||[]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[media,setMedia]=useState([]),[agentMode,setAgentMode]=useState(false),[showHistory,setShowHistory]=useState(false);const scroll=useRef(null);const audioRecorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);
 useEffect(()=>{setMessages(data.chat||[]);},[]);
 useEffect(()=>{if(!messages.length){setData(v=>({...v,chat:messages}));return;}setData(v=>{const id=v.currentChatId||uid();const item={id,title:messages.find(m=>m.role==='user')?.content?.slice(0,35)||'Yeni sohbet',messages};const sessions=[item,...(v.chatSessions||[]).filter(x=>x.id!==id)].slice(0,40);return {...v,chat:messages,currentChatId:id,chatSessions:sessions};});},[messages]);
 useEffect(()=>{if(initialPrompt){setInput(initialPrompt);setInitialPrompt('');}},[initialPrompt]);
 async function attach(kind,camera=false){try{let asset;if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error('Kamera izni gerekli.');const result=await ImagePicker.launchCameraAsync({mediaTypes:kind==='video'?['videos']:['images'],quality:.75,base64:kind==='image',videoMaxDuration:60});asset=result.canceled?null:result.assets?.[0];}else asset=await chooseMedia(kind);if(!asset)return;const payload=await mediaPayload(asset,kind);setMedia(v=>[...v,payload].slice(0,15));}catch(e){Alert.alert('Medya eklenemedi',e.message);}}
 async function send(textOverride){const prompt=(textOverride??input).trim();if((!prompt&&!media.length)||busy)return;if(!prompt&&media.length){setError('Dosyaları incelemem için ne yapmamı istediğini de yaz.');return;}const user={id:uid(),role:'user',content:prompt,media:media.map(x=>({kind:x.kind,name:x.name,uri:x.uri}))};const next=[...messages,user];setMessages(next);setInput('');setBusy(true);setError('');try{const imgs=media.filter(x=>x.kind==='image').map(x=>x.data);const frames=media.filter(x=>x.kind==='video').flatMap(x=>x.frames).slice(0,Math.max(0,15-imgs.length));const timeline=media.filter(x=>x.kind==='video').map(x=>`Video: ${x.name}. Üç kronolojik kareyi incele; videonun tamamını veya sesini analiz ettiğini iddia etme.`).join('\n');const result=await apiChat(session,{prompt:prompt+(timeline?`\n\n${timeline}`:''),history:messages.slice(-12).map(m=>({role:m.role,content:m.content})),images:imgs,videoFrames:frames,projectContext:projectContext||'',personalMemory:data.memories.slice(-12).map(content=>({content,category:'Kullanıcı hafızası'})),agentMode});setMessages(v=>[...v,{id:uid(),role:'assistant',content:result.answer,sources:result.sources||[]}]);setMedia([]);}catch(e){setError(e.message||'Bağlantı kurulamadı.');}finally{setBusy(false);}}
 async function voice(){try{const p=await AudioModule.requestRecordingPermissionsAsync();if(!p.granted)throw new Error('Mikrofon izni gerekli.');await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});await audioRecorder.prepareToRecordAsync();audioRecorder.record();Alert.alert('Ses kaydı','Kaydı bitirmek için Tamam’a dokun.',[{text:'İptal',style:'cancel',onPress:async()=>{try{await audioRecorder.stop();}catch{}}},{text:'Tamam',onPress:async()=>{try{await audioRecorder.stop();const uri=audioRecorder.uri;if(!uri)throw new Error('Ses kaydı bulunamadı.');const b64=await FileSystem.readAsStringAsync(uri,{encoding:FileSystem.EncodingType.Base64});const r=await fetch(`${API_BASE_URL}/api/transcribe`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({audio:b64,mimeType:'audio/mp4'})});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Ses çözümlenemedi.');setInput(v=>`${v}${v?' ':''}${d.text}`);}catch(e){Alert.alert('Ses işlenemedi',e.message);}}}]);}catch(e){Alert.alert('Sesli giriş',e.message);}}
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={s.screen}><View style={s.screenHeader}><View><Text style={s.eyebrow}>TOZRA ASİSTAN</Text><Text style={s.screenTitle}>Sohbet</Text></View><View style={{flexDirection:'row',gap:16}}><Pressable onPress={()=>setShowHistory(v=>!v)}><Ionicons name="time-outline" color={C.muted} size={20}/></Pressable><Pressable onPress={()=>Alert.alert('Yeni sohbet','Mevcut sohbet geçmişte saklanacak. Yeni sohbet başlatılsın mı?',[{text:'Vazgeç',style:'cancel'},{text:'Yeni sohbet',onPress:()=>{setData(v=>({...v,currentChatId:uid()}));setMessages([]);setShowHistory(false);}}])}><Ionicons name="add-circle-outline" color={C.muted} size={20}/></Pressable></View></View>{showHistory?<Card style={{marginTop:10,marginBottom:6}}><Text style={s.cardTitle}>Sohbet geçmişi</Text>{(data.chatSessions||[]).filter(x=>x.id!==data.currentChatId).slice(0,8).map(x=><Pressable key={x.id} onPress={()=>{setData(v=>({...v,currentChatId:x.id}));setMessages(x.messages||[]);setShowHistory(false);}} style={s.historyRow}><Text numberOfLines={1} style={{color:C.text,fontSize:11,flex:1}}>{x.title||'Sohbet'}</Text><Ionicons name="chevron-forward" color={C.faint}/></Pressable>)}{!(data.chatSessions||[]).some(x=>x.id!==data.currentChatId)?<Text style={s.smallMuted}>Önceki sohbet bulunmuyor.</Text>:null}</Card>:null}<ScrollView ref={scroll} onContentSizeChange={()=>scroll.current?.scrollToEnd({animated:true})} contentContainerStyle={s.messageList} keyboardShouldPersistTaps="handled">{messages.length===0?<View style={s.chatWelcome}><View style={s.chatSpark}><Ionicons name="sparkles" color={C.accent} size={26}/></View><Text style={s.cardTitle}>Nasıl yardımcı olabilirim?</Text><Text style={s.muted}>Bir fikir, soru, görsel veya proje ile başlayabilirsin.</Text>{['Bana haftalık bir plan hazırla','Yeni bir marka fikri geliştir','Bu konuyu araştır ve kaynaklandır'].map(x=><Pressable key={x} onPress={()=>setInput(x)} style={s.suggestion}><Text style={s.suggestionText}>{x}</Text><Ionicons name="arrow-up" color={C.accent}/></Pressable>)}</View>:messages.map(m=><View key={m.id} style={[s.bubble,m.role==='user'?s.userBubble:s.aiBubble]}><Text style={s.messageRole}>{m.role==='user'?'SEN':'TOZRA'}</Text><Text style={s.messageText}>{m.content}</Text>{m.media?.length?<Text style={s.smallMuted}>{m.media.length} medya eklendi</Text>:null}{m.sources?.length?<Text style={s.smallMuted}>{m.sources.length} kaynak</Text>:null}</View>)}{busy?<View style={[s.bubble,s.aiBubble, s.busyRow]}><ActivityIndicator color={C.accent}/><Text style={s.messageText}>TOZRA düşünüyor…</Text></View>:null}</ScrollView>{media.length>0?<ScrollView horizontal style={{maxHeight:55}}>{media.map((m,i)=><View key={i} style={s.mediaChip}><Ionicons name={m.kind==='video'?'videocam':'image'} color={C.accent}/><Text style={s.smallMuted}>{m.name.slice(0,17)}</Text><Pressable onPress={()=>setMedia(v=>v.filter((_,j)=>j!==i))}><Ionicons name="close" color={C.faint}/></Pressable></View>)}</ScrollView>:null}{error?<Text style={s.error}>{error}</Text>:null}<View style={s.composer}><View style={s.attachRow}><Pressable onPress={()=>attach('image')}><Ionicons name="image-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>attach('image',true)}><Ionicons name="camera-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>attach('video')}><Ionicons name="videocam-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>attach('video',true)}><Ionicons name="radio-button-on-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={voice}><Ionicons name="mic-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>setAgentMode(v=>!v)} style={{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:4}}><Ionicons name="flash-outline" color={agentMode?C.accent:C.muted} size={16}/><Text style={{color:agentMode?C.accent:C.faint,fontSize:9,fontWeight:'800'}}>AGENT {agentMode?'AÇIK':'KAPALI'}</Text></Pressable></View><TextInput value={input} onChangeText={setInput} placeholder="Mesajını yaz…" placeholderTextColor={C.faint} multiline style={s.composerInput}/><Pressable onPress={()=>send()} disabled={busy||(!input.trim()&&!media.length)} style={[s.sendButton,(busy||(!input.trim()&&!media.length))&&{opacity:.4}]}><Ionicons name="arrow-up" size={20} color="#10150D"/></Pressable></View><Text style={s.disclaimer}>Görsel ve video analizinde videodan en fazla üç kare örneklenir.</Text></View></KeyboardAvoidingView>;
}

function ProjectsScreen({data,setData,session,onOpenChat}) {
 const [editing,setEditing]=useState(false),[name,setName]=useState(''),[category,setCategory]=useState('Fikir geliştirme'),[description,setDescription]=useState(''),[selected,setSelected]=useState(null),[milestone,setMilestone]=useState(''),[task,setTask]=useState(''),[analysisBusy,setAnalysisBusy]=useState(false),[analysisError,setAnalysisError]=useState('');
 function create(){if(!name.trim())return;const p={id:uid(),name:name.trim(),category,description:description.trim(),createdAt:Date.now(),updatedAt:Date.now(),studio:{goal:'',milestones:[],tasks:[],intelligence:null},notes:''};setData(v=>({...v,projects:[p,...v.projects]}));setName('');setDescription('');setEditing(false);setSelected(p.id);}
 const project=data.projects.find(p=>p.id===selected);
 function update(fn){setData(v=>({...v,projects:v.projects.map(p=>{if(p.id!==selected)return p;const base={...p,studio:{goal:'',milestones:[],tasks:[],...(p.studio||{})}};return {...fn(base),updatedAt:Date.now()};})}));}
 async function analyze(){
  if(!project||analysisBusy)return;setAnalysisBusy(true);setAnalysisError('');
  const st=project.studio||{};const milestones=st.milestones||[];const tasks=st.tasks||[];
  const prompt=`TOZRA PROJECT INTELLIGENCE / PROJE ANALİZİ\n\nProjeyi bir ürün yöneticisi ve yaratıcı stratejist gibi değerlendir. Yalnızca verilen bilgilerden hareket et; eksik bilgileri varsayım olarak işaretle. Gerçekçi, uygulanabilir ve kısa öneriler üret.\n\nProje adı: ${project.name}\nKategori: ${project.category}\nAçıklama: ${project.description||'Yok'}\nHedef: ${st.goal||'Henüz belirlenmedi'}\nKilometre taşları: ${milestones.map(x=>`${x.done?'[Tamamlandı]':'[Bekliyor]'} ${x.title}`).join('; ')||'Yok'}\nGörevler: ${tasks.map(x=>`${x.done?'[Tamamlandı]':'[Bekliyor]'} ${x.title}`).join('; ')||'Yok'}\nNotlar: ${project.notes||'Yok'}\n\nSADECE geçerli JSON döndür, markdown kullanma. Şema: {"health":"İyi|Dikkat gerekli|Riskli", "score":0, "summary":"2-3 cümlelik durum özeti", "risks":["..."], "nextSteps":["..."], "milestones":["..."], "questions":["..."]}. score 0-100 arası, ilerleme yüzdesi değil proje hazırlık/sağlık değerlendirmesi olsun. nextSteps ve milestones en fazla 4'er madde, risks ve questions en fazla 3'er madde. Öneriler proje bağlamına özel olsun.`;
  try{
   const result=await apiChat(session,{prompt,history:[],projectContext:`TOZRA projesi: ${project.name}`,personalMemory:(data.memories||[]).slice(-8).map(content=>({content,category:'Tercih'}))});
   const raw=(result.answer||'').trim();let parsed=null;
   try{const clean=raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const a=clean.indexOf('{'),b=clean.lastIndexOf('}');if(a>=0&&b>a)parsed=JSON.parse(clean.slice(a,b+1));}catch{}
   if(!parsed)parsed={health:'Analiz hazır',score:null,summary:raw,risks:[],nextSteps:[],milestones:[],questions:[]};
   parsed.analyzedAt=Date.now();update(p=>({...p,studio:{...p.studio,intelligence:parsed}}));
  }catch(e){setAnalysisError(e.message||'Proje analizi tamamlanamadı.');}
  finally{setAnalysisBusy(false);}
 }
 function addSuggestedTask(title){if(!title)return;update(p=>({...p,studio:{...p.studio,tasks:[...(p.studio?.tasks||[]),{id:uid(),title,done:false,source:'intelligence'}]}}));}
 function addSuggestedMilestone(title){if(!title)return;update(p=>({...p,studio:{...p.studio,milestones:[...(p.studio?.milestones||[]),{id:uid(),title,done:false,source:'intelligence'}]}}));}
 if(project){const studio=project.studio||{goal:'',milestones:[],tasks:[]};const intelligence=studio.intelligence;const milestones=studio.milestones||[];const tasks=studio.tasks||[];const total=milestones.length+tasks.length;const done=milestones.filter(x=>x.done).length+tasks.filter(x=>x.done).length;const progress=total?Math.round(done/total*100):0;
  return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
   <Pressable onPress={()=>setSelected(null)} style={s.back}><Ionicons name="chevron-back" color={C.accent}/> <Text style={s.accentText}>Tüm projeler</Text></Pressable>
   <View style={s.projectHero}><Text style={s.eyebrow}>{project.category.toUpperCase()}</Text><Text style={s.screenTitle}>{project.name}</Text><Text style={s.muted}>{project.description||'Bu proje için henüz açıklama eklenmedi.'}</Text></View>
   <Card style={{borderColor:'#78694F'}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Text style={s.eyebrow}>TOZRA PROJECT INTELLIGENCE</Text><Text style={[s.cardTitle,{fontSize:17,marginTop:5,marginBottom:3}]}>Proje zekâsı</Text><Text style={s.smallMuted}>Projenin durumunu analiz et, riskleri gör ve sonraki adımları planla.</Text></View><View style={{width:42,height:42,borderRadius:13,backgroundColor:'#302D27',alignItems:'center',justifyContent:'center'}}><Ionicons name="analytics-outline" color={C.accent} size={22}/></View></View>
    <Button title={analysisBusy?'Proje analiz ediliyor…':intelligence?'Projeyi yeniden analiz et':'Projeyi analiz et'} icon="sparkles" onPress={analyze} disabled={analysisBusy}/>
    {analysisBusy?<View style={{paddingVertical:12,flexDirection:'row',alignItems:'center',gap:9}}><ActivityIndicator color={C.accent}/><Text style={s.smallMuted}>Hedefler, görevler ve proje notları değerlendiriliyor…</Text></View>:null}
    {analysisError?<Text style={s.error}>{analysisError}</Text>:null}
    {intelligence?<View style={{marginTop:14,borderTopWidth:1,borderTopColor:C.line,paddingTop:13}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><Text style={s.cardTitle}>Analiz sonucu</Text><Text style={s.smallMuted}>{new Date(intelligence.analyzedAt||Date.now()).toLocaleString('tr-TR')}</Text></View>
      <View style={{flexDirection:'row',alignItems:'center',gap:9,marginBottom:10}}><View style={{paddingHorizontal:10,paddingVertical:6,borderRadius:9,backgroundColor:C.surface2}}><Text style={{color:C.accent,fontWeight:'900',fontSize:10}}>{intelligence.health||'Değerlendirme'}</Text></View>{Number.isFinite(intelligence.score)?<Text style={s.smallMuted}>Hazırlık puanı: {intelligence.score}/100</Text>:null}</View>
      <Text style={{color:C.text,fontSize:12,lineHeight:19}}>{intelligence.summary}</Text>
      {intelligence.risks?.length?<><Heading title="Dikkat edilmesi gerekenler"/><View style={{gap:7}}>{intelligence.risks.map((x,i)=><View key={`r${i}`} style={{flexDirection:'row',gap:8,alignItems:'flex-start'}}><Ionicons name="alert-circle-outline" color={C.accent} size={16}/><Text style={[s.taskText,{flex:1,lineHeight:18}]}>{x}</Text></View>)}</View></>:null}
      {intelligence.nextSteps?.length?<><Heading title="Önerilen sonraki adımlar"/><View style={{gap:8}}>{intelligence.nextSteps.map((x,i)=><View key={`n${i}`} style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.surface2,borderRadius:11,padding:10}}><Text style={{color:C.accent,fontWeight:'900'}}>{i+1}.</Text><Text style={[s.taskText,{flex:1,lineHeight:17}]}>{x}</Text><Pressable onPress={()=>addSuggestedTask(x)} style={{padding:5}}><Ionicons name="add-circle-outline" color={C.accent} size={21}/></Pressable></View>)}</View><Text style={s.smallMuted}>+ simgesine dokunarak öneriyi proje görevlerine ekleyebilirsin.</Text></>:null}
      {intelligence.milestones?.length?<><Heading title="Önerilen kilometre taşları"/><View style={{gap:8}}>{intelligence.milestones.map((x,i)=><View key={`m${i}`} style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.surface2,borderRadius:11,padding:10}}><Ionicons name="flag-outline" color={C.accent}/><Text style={[s.taskText,{flex:1,lineHeight:17}]}>{x}</Text><Pressable onPress={()=>addSuggestedMilestone(x)} style={{padding:5}}><Ionicons name="add-circle-outline" color={C.accent} size={21}/></Pressable></View>)}</View></>:null}
      {intelligence.questions?.length?<><Heading title="Netleştirilmesi gerekenler"/>{intelligence.questions.map((x,i)=><Text key={`q${i}`} style={[s.smallMuted,{color:C.muted,marginBottom:5}]}>• {x}</Text>)}</>:null}
    </View>:null}
   </Card>
   <Heading title="Proje ilerlemesi" hint={`${done}/${total} TAMAMLANDI`}/><Card><View style={{height:7,backgroundColor:C.surface2,borderRadius:8,overflow:'hidden'}}><View style={{height:7,width:`${progress}%`,backgroundColor:C.accent,borderRadius:8}}/></View><Text style={[s.smallMuted,{marginTop:8}]}>Görevler ve kilometre taşlarına göre %{progress} tamamlandı.</Text></Card>
   <Heading title="Proje hedefi"/><Card><Field value={studio.goal||''} onChangeText={v=>update(p=>({...p,studio:{...p.studio,goal:v}}))} placeholder="Bu projeyle ulaşmak istediğin sonuç…" multiline style={{minHeight:75,textAlignVertical:'top'}}/></Card>
   <Heading title="Kilometre taşları" hint="PROJE İLERLEMESİ"/><Card><View style={s.addRow}><Field value={milestone} onChangeText={setMilestone} placeholder="Yeni aşama ekle…" style={{flex:1}}/><Pressable style={s.addButton} onPress={()=>{if(milestone.trim()){update(p=>({...p,studio:{...p.studio,milestones:[...(p.studio?.milestones||[]),{id:uid(),title:milestone,done:false}]}}));setMilestone('');}}}><Ionicons name="add" size={22} color="#10150D"/></Pressable></View>{milestones.map(m=><TaskRow key={m.id} task={m} onToggle={()=>update(p=>({...p,studio:{...p.studio,milestones:p.studio.milestones.map(x=>x.id===m.id?{...x,done:!x.done}:x)}}))} onDelete={()=>update(p=>({...p,studio:{...p.studio,milestones:p.studio.milestones.filter(x=>x.id!==m.id)}}))}/>)}</Card>
   <Heading title="Proje görevleri"/><Card><View style={s.addRow}><Field value={task} onChangeText={setTask} placeholder="Proje görevi ekle…" style={{flex:1}}/><Pressable style={s.addButton} onPress={()=>{if(task.trim()){update(p=>({...p,studio:{...p.studio,tasks:[...(p.studio?.tasks||[]),{id:uid(),title:task,done:false}]}}));setTask('');}}}><Ionicons name="add" size={22} color="#10150D"/></Pressable></View>{tasks.map(t=><TaskRow key={t.id} task={t} onToggle={()=>update(p=>({...p,studio:{...p.studio,tasks:p.studio.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}}))} onDelete={()=>update(p=>({...p,studio:{...p.studio,tasks:p.studio.tasks.filter(x=>x.id!==t.id)}}))}/>)}</Card>
   <Heading title="Proje notları"/><Card><Field value={project.notes||''} onChangeText={v=>update(p=>({...p,notes:v}))} placeholder="Proje notları…" multiline style={{minHeight:110,textAlignVertical:'top'}}/></Card>
   <Button title="Bu projede TOZRA ile çalış" icon="sparkles" onPress={()=>onOpenChat(`Proje: ${project.name}\nKategori: ${project.category}\nAçıklama: ${project.description}\nHedef: ${studio.goal||'Belirtilmedi'}\nNotlar: ${project.notes||''}\nSon proje analizi: ${intelligence?.summary||'Henüz analiz edilmedi'}\nBu proje üzerinde birlikte çalışalım.`)}/>
   <Button title="Projeyi sil" secondary icon="trash-outline" onPress={()=>Alert.alert('Projeyi sil','Bu proje kalıcı olarak silinsin mi?',[{text:'Vazgeç',style:'cancel'},{text:'Sil',style:'destructive',onPress:()=>{setData(v=>({...v,projects:v.projects.filter(p=>p.id!==selected)}));setSelected(null);}}])}/>
  </ScrollView>;
 }
 return <ScrollView contentContainerStyle={s.page}><View style={s.screenHeader}><View><Text style={s.eyebrow}>ÜRETİM ALANIN</Text><Text style={s.screenTitle}>Projeler</Text></View><Pressable style={s.addButton} onPress={()=>setEditing(v=>!v)}><Ionicons name={editing?'close':'add'} color="#10150D" size={23}/></Pressable></View>{editing?<Card><Text style={s.cardTitle}>Yeni proje</Text><Field value={name} onChangeText={setName} placeholder="Proje adı"/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,marginBottom:12}}>{['Fikir geliştirme','İçerik üretimi','Görsel stüdyo','Video stüdyo','Araştırma'].map(x=><Chip key={x} label={x} active={category===x} onPress={()=>setCategory(x)}/>)}</ScrollView><Field value={description} onChangeText={setDescription} placeholder="Kısa açıklama" multiline/><Button title="Projeyi oluştur" onPress={create}/></Card>:null}{data.projects.length===0?<Card><Text style={s.empty}>Henüz proje yok. İlk projenin çalışma alanını oluştur.</Text></Card>:data.projects.map(p=><Pressable key={p.id} onPress={()=>setSelected(p.id)} style={s.projectCard}><View style={s.projectIcon}><Ionicons name="folder-open-outline" color={C.accent} size={21}/></View><View style={{flex:1}}><Text style={s.cardTitle}>{p.name}</Text><Text style={s.smallMuted}>{p.category} · {p.description||'Açıklama eklenmedi'}</Text><Text style={s.smallMuted}>{(p.studio?.milestones||[]).filter(x=>x.done).length}/{(p.studio?.milestones||[]).length} aşama tamamlandı</Text></View><Ionicons name="chevron-forward" color={C.faint}/></Pressable>)}</ScrollView>;
}

function StudioScreen({session,data,setData,onOpenChat}) {
 const [mode,setMode]=useState('idea'),[name,setName]=useState(''),[brief,setBrief]=useState(''),[audience,setAudience]=useState(''),[style,setStyle]=useState(''),[platform,setPlatform]=useState(''),[duration,setDuration]=useState('30 saniye'),[format,setFormat]=useState('9:16 dikey'),[sceneCount,setSceneCount]=useState('6'),[busy,setBusy]=useState(false),[result,setResult]=useState(''),[image,setImage]=useState(''),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const current=MODES[mode];
 const presets={idea:['Yeni bir dijital ürün fikri','Bir markayı farklılaştır','Bir içerik serisi tasarla'],image:['Premium ürün fotoğrafı','Minimal marka görseli','Sinematik kampanya görseli'],video:['30 saniyelik tanıtım videosu','Sosyal medya reklamı','Ürün lansman videosu'],brand:['Yeni marka kimliği','Mevcut markayı yenile','Logo ve görsel sistem'],content:['Instagram içerik serisi','Blog yazısı ve başlıkları','Kısa video metni'],campaign:['Ürün lansman kampanyası','Marka bilinirliği kampanyası','Sosyal medya kampanyası']};
 function buildPrompt(){
  const videoDetails=mode==='video'?`\nVideo süresi: ${duration}\nGörüntü oranı: ${format}\nSahne sayısı: ${sceneCount}`:'';
  return `CREATIVE STUDIO / ${current.title}\n${current.instruction}\n\nÇalışma adı: ${name.trim()||current.title}\nKullanıcı brief'i: ${brief.trim()}\nHedef kitle: ${audience.trim()||'Belirtilmedi'}\nGörsel yaklaşım / ton: ${style.trim()||'Yaratıcı ve amaca uygun yaklaşımı sen öner'}\nPlatform / kullanım alanı: ${platform.trim()||'Belirtilmedi'}${videoDetails}\n\nÇIKTI KURALLARI:\n- Önce kısa bir yaratıcı yön özeti ver.\n- Sonra uygulanabilir, başlıklandırılmış ve detaylı çıktı hazırla.\n- Belirsiz varsayımları açıkça belirt.\n- En sonda somut sonraki adımları listele.\n- Gerçek medya dosyası oluşturmadıysan oluşturduğunu iddia etme.`;
 }
 async function run(){if(!brief.trim())return;setBusy(true);setError('');setResult('');setImage('');setSaved(false);try{
   if(mode==='image'){
    const prompt=`Professional creative visual. ${brief.trim()}. Audience: ${audience.trim()||'general'}. Art direction: ${style.trim()||'premium, refined, purposeful'}. Usage: ${platform.trim()||'digital campaign'}.`;
    const r=await fetch(`${API_BASE_URL}/api/generate-image`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({prompt})});
    const d=await r.json();if(!r.ok||!d.success||!d.image)throw new Error(d.error||'Görsel üretilemedi.');setImage(d.image);
   }else{
    const r=await apiChat(session,{prompt:buildPrompt(),history:[],personalMemory:(data.memories||[]).slice(-8).map(content=>({content,category:'Tercih'}))});
    if(!r?.answer)throw new Error('TOZRA boş yanıt döndürdü.');setResult(r.answer);
   }
  }catch(e){setError(e.message||'İşlem tamamlanamadı.');}finally{setBusy(false);}}
 function saveToProjects(){
  const output=image?`Görsel URL: ${image}\n\nBrief:\n${buildPrompt()}`:result;
  if(!output)return;
  const project={id:uid(),name:(name.trim()||brief.trim().slice(0,42)||current.title),category:current.title,description:brief.trim(),createdAt:Date.now(),updatedAt:Date.now(),studio:{goal:audience.trim(),milestones:[],tasks:[],mode,style:style.trim(),platform:platform.trim(),duration:mode==='video'?duration:undefined,format:mode==='video'?format:undefined,sceneCount:mode==='video'?sceneCount:undefined},notes:`CREATIVE STUDIO ÇIKTISI\n\n${output}`};
  setData(v=>({...v,projects:[project,...(v.projects||[])]}));setSaved(true);
 }
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
  <View style={{marginBottom:16}}><Text style={s.eyebrow}>TOZRA / CREATIVE WORKSPACE</Text><Text style={s.screenTitle}>Creative Studio</Text><Text style={s.muted}>Fikrini yapılandır, üretimini yönlendir ve sonuçlarını projelerine dönüştür.</Text></View>
  <View style={{backgroundColor:C.surface,borderColor:C.line,borderWidth:1,borderRadius:18,padding:15,marginBottom:15}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:11}}><Text style={s.cardTitle}>Çalışma alanı seç</Text><Text style={s.smallMuted}>06 MODÜL</Text></View>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{Object.entries(MODES).map(([key,m])=><Pressable key={key} onPress={()=>{setMode(key);setResult('');setImage('');setError('');setSaved(false);}} style={{width:'31.5%',minHeight:82,padding:9,borderRadius:13,borderWidth:1,borderColor:mode===key?C.accent:C.line,backgroundColor:mode===key?'#302D27':C.surface2,alignItems:'flex-start',justifyContent:'space-between'}}><Ionicons name={m.icon} size={20} color={mode===key?C.accent:C.muted}/><Text style={{color:mode===key?C.text:C.muted,fontSize:10,fontWeight:'800'}}>{m.title}</Text></Pressable>)}</View>
  </View>
  <Card>
   <Text style={s.eyebrow}>01 / YARATICI BRIEF</Text><Text style={[s.cardTitle,{fontSize:17,marginTop:6}]}>{current.title}</Text>
   <Text style={s.smallMuted}>İyi sonuç için ne istediğini ve nerede kullanacağını tanımla.</Text>
   <Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:6,marginTop:14}}>ÇALIŞMA ADI</Text><Field value={name} onChangeText={setName} placeholder="Örn. TOZRA lansman konsepti" />
   <Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:6}}>ANA BRIEF *</Text><Field value={brief} onChangeText={setBrief} placeholder="Ne üretmek istiyorsun? Amacını, fikrini ve önemli detayları anlat…" multiline style={{minHeight:112,textAlignVertical:'top'}} />
   <Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:6}}>HEDEF KİTLE</Text><Field value={audience} onChangeText={setAudience} placeholder="Kime hitap ediyor?" />
   <Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:6}}>GÖRSEL YAKLAŞIM / TON</Text><Field value={style} onChangeText={setStyle} placeholder="Örn. Minimal, premium, sıcak, sinematik…" />
   <Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:6}}>PLATFORM / KULLANIM ALANI</Text><Field value={platform} onChangeText={setPlatform} placeholder="Örn. Instagram, YouTube, web sitesi, sunum…" />
   {mode==='video'?<View style={{marginTop:4}}><Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:7}}>VİDEO AYARLARI</Text><View style={{flexDirection:'row',gap:7,flexWrap:'wrap',marginBottom:9}}>{['15 saniye','30 saniye','60 saniye','90 saniye'].map(x=><Chip key={x} label={x} active={duration===x} onPress={()=>setDuration(x)}/>)}</View><View style={{flexDirection:'row',gap:7,flexWrap:'wrap',marginBottom:9}}>{['9:16 dikey','16:9 yatay','1:1 kare'].map(x=><Chip key={x} label={x} active={format===x} onPress={()=>setFormat(x)}/>)}</View><View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{['4','6','8','10','12'].map(x=><Chip key={x} label={`${x} sahne`} active={sceneCount===x} onPress={()=>setSceneCount(x)}/>)}</View></View>:null}
   <View style={{marginTop:10,marginBottom:5}}><Text style={{color:C.muted,fontSize:10,fontWeight:'800',marginBottom:8}}>BAŞLAMAK İÇİN ÖRNEKLER</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{(presets[mode]||[]).map(x=><Pressable key={x} onPress={()=>setBrief(x)} style={{paddingHorizontal:10,paddingVertical:8,borderRadius:10,backgroundColor:C.surface2,borderWidth:1,borderColor:C.line}}><Text style={{color:C.muted,fontSize:10}}>{x}</Text></Pressable>)}</View></View>
   <Button title={busy?'Hazırlanıyor…':mode==='image'?'Görsel üret':'Çalışmayı oluştur'} onPress={run} disabled={busy||!brief.trim()} icon={mode==='image'?'image-outline':'sparkles'}/>
   {busy?<View style={{alignItems:'center',paddingVertical:13}}><ActivityIndicator color={C.accent}/><Text style={s.smallMuted}>TOZRA brief'ini işliyor…</Text></View>:null}
   {error?<Text style={s.error}>{error}</Text>:null}
  </Card>
  {image?<Card><Text style={s.eyebrow}>02 / GÖRSEL ÇIKTI</Text><Text style={s.cardTitle}>Üretilen görsel</Text><Image source={{uri:image}} style={{width:'100%',height:300,borderRadius:14,backgroundColor:C.surface2}} resizeMode="contain"/><Text style={s.smallMuted}>Görsel üretim servisi tarafından döndürülen çıktı.</Text><Button title={saved?'Projeye kaydedildi':'Projelerime kaydet'} onPress={saveToProjects} disabled={saved} icon="folder-outline"/><Button title="Görseli TOZRA AI ile geliştir" secondary onPress={()=>onOpenChat(`Creative Studio görsel brief'i:\n${buildPrompt()}\nGörseli değerlendir ve geliştirme önerileri sun.`)}/></Card>:null}
  {result?<Card><Text style={s.eyebrow}>02 / ÜRETİM SONUCU</Text><Text style={s.cardTitle}>Studio çıktısı</Text><Text selectable style={s.messageText}>{result}</Text><Button title={saved?'Projeye kaydedildi':'Projelerime kaydet'} onPress={saveToProjects} disabled={saved} icon="folder-outline"/><Button title="TOZRA AI ile geliştirmeye devam et" secondary onPress={()=>onOpenChat(`Creative Studio çıktısı:\n${result}\n\nBu çalışmayı daha ileri geliştir. Eksikleri belirle ve sonraki versiyonu üret.`)}/></Card>:null}
  <Card style={{backgroundColor:C.surface2}}><Text style={s.cardTitle}>Çalışmaların nasıl saklanır?</Text><Text style={s.muted}>Oluşturduğun metin çıktıları ve görsel brief bilgileri, “Projelerime kaydet” dediğinde mevcut TOZRA proje alanına eklenir. Video Studio storyboard ve prodüksiyon planı hazırlar; bu mobil sürüm doğrudan video render etmez.</Text></Card>
 </ScrollView>;
}

function TasksScreen({data,setData}) {
 const [selected,setSelected]=useState(dateKey()),[month,setMonth]=useState(new Date()),[taskTitle,setTaskTitle]=useState(''),[eventTitle,setEventTitle]=useState(''),[eventTime,setEventTime]=useState(''),[taskOpen,setTaskOpen]=useState(false),[eventOpen,setEventOpen]=useState(false),[priority,setPriority]=useState('normal');
 const year=month.getFullYear(),mon=month.getMonth(),days=new Date(year,mon+1,0).getDate(),offset=(new Date(year,mon,1).getDay()+6)%7;const cells=Array.from({length:42},(_,i)=>{const n=i-offset+1;const d=new Date(year,mon,n);return {key:dateKey(d),day:d.getDate(),muted:n<1||n>days};});const todayTasks=data.tasks.filter(t=>t.date===selected),events=data.events.filter(e=>e.date===selected);
 function addTask(){if(!taskTitle.trim())return;setData(v=>({...v,tasks:[...v.tasks,{id:uid(),title:taskTitle.trim(),date:selected,priority,done:false}]}));setTaskTitle('');setTaskOpen(false);}
 function addEvent(){if(!eventTitle.trim())return;setData(v=>({...v,events:[...v.events,{id:uid(),title:eventTitle.trim(),date:selected,time:eventTime,note:''}]}));setEventTitle('');setEventTime('');setEventOpen(false);}
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>PLANLAMA ALANI</Text><Text style={s.screenTitle}>Görevler & Takvim</Text><View style={s.monthHeader}><Pressable onPress={()=>setMonth(new Date(year,mon-1,1))}><Ionicons name="chevron-back" color={C.text} size={21}/></Pressable><Text style={s.cardTitle}>{month.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</Text><Pressable onPress={()=>setMonth(new Date(year,mon+1,1))}><Ionicons name="chevron-forward" color={C.text} size={21}/></Pressable></View><Card><View style={s.calendarGrid}>{['P','S','Ç','P','C','C','P'].map((x,i)=><Text key={`h${i}`} style={s.calendarWeek}>{x}</Text>)}{cells.map(c=>{const has=data.tasks.some(t=>t.date===c.key&&!t.done)||data.events.some(e=>e.date===c.key);return <Pressable key={c.key} onPress={()=>setSelected(c.key)} style={[s.calendarDay,selected===c.key&&s.calendarDayActive,c.muted&&{opacity:.35}]}><Text style={[s.calendarDayText,selected===c.key&&{color:'#10150D'}]}>{c.day}</Text>{has?<View style={[s.calendarDot,selected===c.key&&{backgroundColor:'#10150D'}]}/>:null}</Pressable>;})}</View></Card><View style={s.selectedDateRow}><Text style={s.cardTitle}>{prettyDate(selected)}</Text><View style={{flexDirection:'row',gap:8}}><Pressable onPress={()=>setTaskOpen(v=>!v)} style={s.smallAction}><Ionicons name="add" color={C.accent}/><Text style={s.accentText}>Görev</Text></Pressable><Pressable onPress={()=>setEventOpen(v=>!v)} style={s.smallAction}><Ionicons name="calendar" color={C.accent}/><Text style={s.accentText}>Etkinlik</Text></Pressable></View></View>{taskOpen?<Card><Field value={taskTitle} onChangeText={setTaskTitle} placeholder="Görev adı"/><View style={{flexDirection:'row',gap:7,marginBottom:12}}><Chip label="Normal" active={priority==='normal'} onPress={()=>setPriority('normal')}/><Chip label="Öncelikli" active={priority==='high'} onPress={()=>setPriority('high')}/></View><Button title="Görevi kaydet" onPress={addTask}/></Card>:null}{eventOpen?<Card><Field value={eventTitle} onChangeText={setEventTitle} placeholder="Etkinlik adı"/><Field value={eventTime} onChangeText={setEventTime} placeholder="Saat (örn. 14:30)"/><Button title="Etkinliği kaydet" onPress={addEvent}/></Card>:null}<Heading title="Günün planı" hint={`${todayTasks.length+events.length} KAYIT`}/><Card>{events.map(e=><View key={e.id} style={s.taskRow}><Ionicons name="calendar-outline" color={C.accent}/><View style={{flex:1}}><Text style={s.taskText}>{e.title}</Text><Text style={s.smallMuted}>{e.time||'Saat belirtilmedi'} · Etkinlik</Text></View><Pressable onPress={()=>setData(v=>({...v,events:v.events.filter(x=>x.id!==e.id)}))}><Ionicons name="close" color={C.faint}/></Pressable></View>)}{todayTasks.map(t=><TaskRow key={t.id} task={t} onToggle={()=>setData(v=>({...v,tasks:v.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}))} onDelete={()=>setData(v=>({...v,tasks:v.tasks.filter(x=>x.id!==t.id)}))}/>)}{!todayTasks.length&&!events.length?<Text style={s.empty}>Bu gün için plan bulunmuyor.</Text>:null}</Card></ScrollView>;
}


function TozraWebScreen({onOpenChat}) {
 const [brief,setBrief]=useState('');
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
  <View style={s.hero}><Text style={s.eyebrow}>TOZRA / WEB STUDIO</Text><Text style={s.heroTitle}>Fikrini web'e dönüştür.</Text><Text style={s.muted}>Web siteni tasarla, geliştir ve dijital projeni bir sonraki seviyeye taşı.</Text></View>
  <Heading title="Yeni web projesi" hint="AI DESTEKLİ TASARIM"/>
  <Card><Text style={s.cardTitle}>Nasıl bir site oluşturmak istiyorsun?</Text><Field value={brief} onChangeText={setBrief} placeholder="Örn. Minimal bir portfolyo sitesi; hakkımda, projeler ve iletişim bölümleri olsun…" multiline style={{minHeight:125,textAlignVertical:'top'}}/><Button title="TOZRA AI ile tasarla" onPress={()=>{if(!brief.trim()){Alert.alert('Bir fikir yaz','Oluşturmak istediğin web sitesini kısaca tarif et.');return;}onOpenChat(`TOZRA WEB BUILDER — Aşağıdaki brief için kapsamlı bir web sitesi tasarla ve tek dosyalık, responsive HTML/CSS/JS kodunu üret. Yalnızca çalışan özellikleri ve gerekli kurulumları açıkça belirt. Brief: ${brief.trim()}`);}}/></Card>
  <Heading title="Çalışma araçları" hint="WEB WORKSPACE"/>
  <Card><View style={s.taskRow}><Ionicons name="code-slash-outline" color={C.accent} size={20}/><View style={{flex:1}}><Text style={s.taskText}>Kod düzenleme</Text><Text style={s.smallMuted}>HTML, CSS ve JavaScript çıktıları</Text></View></View><View style={s.taskRow}><Ionicons name="phone-portrait-outline" color={C.accent} size={20}/><View style={{flex:1}}><Text style={s.taskText}>Responsive tasarım</Text><Text style={s.smallMuted}>Mobil ve masaüstü uyumluluğu</Text></View></View><View style={s.taskRow}><Ionicons name="eye-outline" color={C.accent} size={20}/><View style={{flex:1}}><Text style={s.taskText}>Önizleme ve yayın hazırlığı</Text><Text style={s.smallMuted}>Mobil uygulamada kod üretimini sohbet üzerinden başlat</Text></View></View></Card>
  <Text style={s.smallMuted}>Not: Mobil sürümde bu alan AI destekli site briefini TOZRA sohbetine aktarır. Tam görsel editör ve canlı HTML önizleme web sürümünde bulunur.</Text>
 </ScrollView>;
}


const CONNECT_PEOPLE = [
 {id:'creator-01',name:'Deniz Arslan',handle:'@deniz.design',role:'Brand Designer',tags:['Branding','UI/UX'],initials:'DA',tone:'#665B4A'},
 {id:'creator-02',name:'Ece Yılmaz',handle:'@ece.visuals',role:'Visual Creator',tags:['Illustration','Motion'],initials:'EY',tone:'#665D67'},
 {id:'creator-03',name:'Mert Kaya',handle:'@mertbuilds',role:'Creative Developer',tags:['Web','Creative Code'],initials:'MK',tone:'#53645D'},
 {id:'creator-04',name:'Ada Demir',handle:'@adacreates',role:'Content Strategist',tags:['Content','Campaign'],initials:'AD',tone:'#69584D'}
];
function ConnectScreen({user,data,setData,onMessage}) {
 const [section,setSection]=useState('discover'),[query,setQuery]=useState('');
 const following=data.connectFollowing||[];
 const filtered=CONNECT_PEOPLE.filter(p=>(p.name+' '+p.handle+' '+p.role+' '+p.tags.join(' ')).toLowerCase().includes(query.toLowerCase()));
 const toggleFollow=id=>setData(v=>({...v,connectFollowing:(v.connectFollowing||[]).includes(id)?v.connectFollowing.filter(x=>x!==id):[...(v.connectFollowing||[]),id]}));
 return <ScrollView style={s.connectScreen} contentContainerStyle={s.connectContent}>
  <View style={s.connectHeader}>
   <View><Text style={s.connectEyebrow}>TOZRA SOCIAL SPACE</Text><Text style={s.connectTitle}>Connect</Text><Text style={s.connectSubtitle}>Üret. Paylaş. Birlikte geliştir.</Text></View>
   <View style={s.connectHeaderIcon}><Ionicons name="people" size={23} color={C.accent}/></View>
  </View>
  <View style={s.connectStats}>
   <View style={s.connectStat}><Text style={s.connectStatValue}>{following.length}</Text><Text style={s.connectStatLabel}>Takip</Text></View>
   <View style={s.connectStatDivider}/>
   <View style={s.connectStat}><Text style={s.connectStatValue}>0</Text><Text style={s.connectStatLabel}>Bağlantı</Text></View>
   <View style={s.connectStatDivider}/>
   <View style={s.connectStat}><Text style={s.connectStatValue}>0</Text><Text style={s.connectStatLabel}>Toplantı</Text></View>
  </View>
  <View style={s.connectQuickActions}>
   <Pressable style={s.connectQuickCard} onPress={()=>setSection('messages')}><View style={s.connectQuickIcon}><Ionicons name="chatbubble-ellipses-outline" size={19} color={C.accent}/></View><Text style={s.connectQuickTitle}>Mesajlar</Text><Text style={s.connectQuickHint}>Sohbetlerini aç</Text></Pressable>
   <Pressable style={s.connectQuickCard} onPress={()=>setSection('meetings')}><View style={s.connectQuickIcon}><Ionicons name="videocam-outline" size={19} color={C.accent}/></View><Text style={s.connectQuickTitle}>Meetings</Text><Text style={s.connectQuickHint}>Toplantı alanı</Text></Pressable>
  </View>
  <View style={s.connectSectionTabs}>
   {[['discover','Keşfet'],['following','Takip'],['messages','Mesajlar'],['meetings','Toplantılar']].map(([id,label])=><Pressable key={id} onPress={()=>setSection(id)} style={[s.connectSectionTab,section===id&&s.connectSectionTabActive]}><Text style={[s.connectSectionTabText,section===id&&s.connectSectionTabTextActive]}>{label}</Text></Pressable>)}
  </View>
  {section==='discover'?<View>
   <View style={s.connectSearch}><Ionicons name="search" color={C.faint} size={18}/><TextInput value={query} onChangeText={setQuery} placeholder="İsim, yetenek veya kullanıcı adı ara" placeholderTextColor={C.faint} style={s.connectSearchInput}/></View>
   <View style={s.connectSectionHeading}><Text style={s.connectHeading}>Yaratıcıları keşfet</Text><Text style={s.connectMuted}>Örnek profil kartları</Text></View>
   {filtered.map(person=><View key={person.id} style={s.connectPersonCard}>
    <View style={[s.connectPersonAvatar,{backgroundColor:person.tone}]}><Text style={s.connectPersonInitials}>{person.initials}</Text><View style={s.connectOnlineDot}/></View>
    <View style={s.connectPersonInfo}><Text style={s.connectPersonName}>{person.name}</Text><Text style={s.connectPersonHandle}>{person.handle} · {person.role}</Text><View style={s.connectTags}>{person.tags.map(tag=><View key={tag} style={s.connectTag}><Text style={s.connectTagText}>{tag}</Text></View>)}</View></View>
    <Pressable onPress={()=>toggleFollow(person.id)} style={[s.connectFollowButton,following.includes(person.id)&&s.connectFollowingButton]}><Ionicons name={following.includes(person.id)?'checkmark':'add'} size={15} color={following.includes(person.id)?C.text:C.bg}/><Text style={[s.connectFollowText,following.includes(person.id)&&s.connectFollowingText]}>{following.includes(person.id)?'Takipte':'Takip et'}</Text></Pressable>
   </View>)}
   <Text style={s.connectDisclaimer}>Bu kartlar arayüz önizlemesi için örnektir. Gerçek kullanıcı keşfi için Connect veritabanı ve profil servisi kurulmalıdır.</Text>
  </View>:null}
  {section==='following'?<View><Text style={s.connectHeading}>Takip ettiklerin</Text>{CONNECT_PEOPLE.filter(p=>following.includes(p.id)).map(person=><View key={person.id} style={s.connectPersonCard}><View style={[s.connectPersonAvatar,{backgroundColor:person.tone}]}><Text style={s.connectPersonInitials}>{person.initials}</Text></View><View style={s.connectPersonInfo}><Text style={s.connectPersonName}>{person.name}</Text><Text style={s.connectPersonHandle}>{person.handle}</Text></View><Pressable onPress={()=>toggleFollow(person.id)} style={s.connectSmallAction}><Text style={s.connectSmallActionText}>Takiptesin</Text></Pressable></View>)}{following.length===0?<Text style={s.connectEmpty}>Henüz kimseyi takip etmiyorsun. Keşfet bölümünden yaratıcıları bulabilirsin.</Text>:null}</View>:null}
  {section==='messages'?<View style={s.connectFeaturePanel}><View style={s.connectFeatureIcon}><Ionicons name="chatbubbles-outline" size={28} color={C.accent}/></View><Text style={s.connectFeatureTitle}>Sohbet alanın</Text><Text style={s.connectFeatureText}>Arkadaşlarınla birebir ve grup sohbetleri burada görünecek. Gerçek kullanıcılar arası mesajlaşma için sunucu tarafı konuşma sistemi henüz bağlanmadı.</Text><Pressable style={s.connectPrimaryAction} onPress={()=>onMessage('TOZRA Connect mesajlaşma sistemini tasarla. Birebir sohbet, grup sohbeti, mesaj istekleri ve dosya paylaşımı akışlarını planla.')}><Text style={s.connectPrimaryActionText}>Mesajlaşmayı planla</Text><Ionicons name="arrow-forward" size={16} color={C.bg}/></Pressable></View>:null}
  {section==='meetings'?<View style={s.connectFeaturePanel}><View style={s.connectFeatureIcon}><Ionicons name="videocam-outline" size={28} color={C.accent}/></View><Text style={s.connectFeatureTitle}>TOZRA Meetings</Text><Text style={s.connectFeatureText}>Görüntülü toplantılar, davet bağlantıları, bekleme odası ve ekran paylaşımı için özel toplantı alanı.</Text><View style={s.connectMeetingRow}><Ionicons name="shield-checkmark-outline" size={17} color={C.accent}/><Text style={s.connectMeetingText}>Davet onayı ve bekleme odası tasarımın parçası</Text></View><Pressable style={s.connectPrimaryAction} onPress={()=>Alert.alert('Toplantılar yakında','Görüntülü görüşme servisi henüz bağlanmadı. Önce toplantı altyapısını kuracağız.')}><Text style={s.connectPrimaryActionText}>Toplantı alanı</Text><Ionicons name="arrow-forward" size={16} color={C.bg}/></Pressable></View>:null}
  <View style={s.connectFooter}><Text style={s.connectFooterText}>TOZRA CONNECT · BUILD YOUR CIRCLE</Text></View>
 </ScrollView>;
}


function decodeBase64ToBytes(base64) {
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 const clean=base64.replace(/[^A-Za-z0-9+/]/g,'');
 const bytes=new Uint8Array(Math.floor(clean.length*3/4));
 let buffer=0,bits=0,index=0;
 for(const char of clean){buffer=(buffer<<6)|alphabet.indexOf(char);bits+=6;if(bits>=8){bits-=8;bytes[index++]=(buffer>>bits)&255;}}
 return bytes.slice(0,index);
}

function ProfileScreen({user,onSignOut,data,setData}) {
 const [memory,setMemory]=useState('');
 const [profile,setProfile]=useState({username:'',display_name:user?.user_metadata?.full_name||'',bio:'',skills:'',interests:'',is_private:true,avatar_url:data.profileAvatar||null});
 const [profileBusy,setProfileBusy]=useState(true),[saving,setSaving]=useState(false),[profileError,setProfileError]=useState('');
 useEffect(()=>{let active=true;(async()=>{
  try{
   const sb=getSupabase();
   const {data:row,error}=await sb.from('profiles').select('username,display_name,bio,skills,interests,is_private,avatar_url').eq('id',user.id).maybeSingle();
   if(error)throw error;
   if(row&&active){setProfile({username:row.username||'',display_name:row.display_name||'',bio:row.bio||'',skills:Array.isArray(row.skills)?row.skills.join(', '):'',interests:Array.isArray(row.interests)?row.interests.join(', '):'',is_private:row.is_private!==false,avatar_url:row.avatar_url||null});if(row.avatar_url)setData(v=>({...v,profileAvatar:row.avatar_url}));}
   else if(active){setProfile(v=>({...v,avatar_url:data.profileAvatar||null}));}
  }catch(e){if(active)setProfileError('Profil bilgileri yüklenemedi. profiles tablosu için kurulum SQL dosyasını çalıştır.');}
  finally{if(active)setProfileBusy(false);}
 })();return()=>{active=false;};},[user.id]);
 function update(key,value){setProfile(v=>({...v,[key]:value}));}
 async function saveProfile(){
  const username=profile.username.trim().toLowerCase().replace(/^@/,'');
  if(!/^[a-z0-9_\.]{3,24}$/.test(username)){Alert.alert('Kullanıcı adı geçersiz','3–24 karakter kullan. Yalnızca İngilizce harf, rakam, nokta ve alt çizgi kullanabilirsin.');return;}
  if(!profile.display_name.trim()){Alert.alert('Ad gerekli','Görünen ad alanını doldur.');return;}
  setSaving(true);setProfileError('');
  try{
   const payload={id:user.id,username,display_name:profile.display_name.trim(),bio:profile.bio.trim().slice(0,160),skills:profile.skills.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),interests:profile.interests.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),is_private:!!profile.is_private,avatar_url:profile.avatar_url||null,updated_at:new Date().toISOString()};
   const {error}=await getSupabase().from('profiles').upsert(payload,{onConflict:'id'});
   if(error)throw error;
   setProfile(v=>({...v,username,display_name:payload.display_name}));
   setData(v=>({...v,profileAvatar:payload.avatar_url}));
   Alert.alert('Profil kaydedildi','Profil bilgilerin Supabase hesabına kaydedildi.');
  }catch(e){const message=e?.code==='23505'?'Bu kullanıcı adı zaten alınmış.':(e.message||'Profil kaydedilemedi.');setProfileError(message);Alert.alert('Kayıt başarısız',message);}
  finally{setSaving(false);}
 }
 async function chooseProfilePhoto(){
  try{
   const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
   if(!permission.granted){Alert.alert('Galeri izni gerekli','Profil fotoğrafı seçebilmek için galeri erişimine izin vermelisin.');return;}
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.82});
   if(result.canceled||!result.assets?.[0]?.uri)return;
   const prepared=await ImageManipulator.manipulateAsync(result.assets[0].uri,[{resize:{width:480,height:480}}],{compress:.72,format:ImageManipulator.SaveFormat.JPEG,base64:true});
   if(!prepared.base64)throw new Error('Fotoğraf hazırlanamadı.');
   const path=`${user.id}/avatar-${Date.now()}.jpg`;
   const bytes=decodeBase64ToBytes(prepared.base64);
   const {error:uploadError}=await getSupabase().storage.from('profile-avatars').upload(path,bytes,{contentType:'image/jpeg',upsert:true});
   if(uploadError)throw uploadError;
   const {data:publicData}=getSupabase().storage.from('profile-avatars').getPublicUrl(path);
   update('avatar_url',publicData.publicUrl);
   setData(v=>({...v,profileAvatar:publicData.publicUrl}));
   Alert.alert('Fotoğraf yüklendi','Fotoğrafın profil fotoğrafı olarak hazır. Kalıcı olması için Profili kaydet düğmesine dokun.');
  }catch(e){Alert.alert('Fotoğraf eklenemedi',e.message||'Beklenmeyen bir hata oluştu. SQL kurulumunu ve Storage izinlerini kontrol et.');}
 }
 function removeProfilePhoto(){Alert.alert('Profil fotoğrafı kaldırılsın mı?','Profil fotoğrafın profilinden kaldırılacak.',[{text:'Vazgeç',style:'cancel'},{text:'Kaldır',style:'destructive',onPress:()=>{update('avatar_url',null);setData(v=>({...v,profileAvatar:null}));}}]);}
 return <ScrollView contentContainerStyle={s.page}>
  <View style={s.profileHero}>
   <Pressable onPress={chooseProfilePhoto} style={s.profileAvatarButton}>
    {profile.avatar_url?<Image source={{uri:profile.avatar_url}} style={s.profileAvatarImage}/>:<View style={s.avatar}><Ionicons name="person" color={C.accent} size={30}/></View>}
    <View style={s.avatarEditBadge}><Ionicons name="camera" color="#171715" size={14}/></View>
   </Pressable>
   <Text style={s.screenTitle}>{profile.display_name||'TOZRA kullanıcısı'}</Text>
   <Text style={s.muted}>{profile.username?`@${profile.username}`:(user?.email||'Kullanıcı adını belirle')}</Text>
   <Text style={s.smallMuted}>Profil fotoğrafını değiştirmek için fotoğrafa dokun.</Text>
   {profile.avatar_url?<Pressable onPress={removeProfilePhoto} style={s.removeAvatarAction}><Text style={s.removeAvatarText}>Fotoğrafı kaldır</Text></Pressable>:null}
  </View>
  <Heading title="Connect profilin" hint="GERÇEK PROFİL"/>
  <Card>
   {profileBusy?<ActivityIndicator color={C.accent}/>:<>
    <Text style={s.muted}>Bu bilgiler Connect profilinde kullanılacak. E-posta adresin herkese açık gösterilmez.</Text>
    <Text style={s.connectFormLabel}>Kullanıcı adı</Text><Field value={profile.username} onChangeText={v=>update('username',v)} placeholder="ornek_kullanici" autoCapitalize="none" maxLength={24}/>
    <Text style={s.connectFormLabel}>Görünen ad</Text><Field value={profile.display_name} onChangeText={v=>update('display_name',v)} placeholder="Adın veya yaratıcı adın" maxLength={48}/>
    <Text style={s.connectFormLabel}>Biyografi</Text><Field value={profile.bio} onChangeText={v=>update('bio',v)} placeholder="Kendini kısaca tanıt…" multiline maxLength={160}/>
    <Text style={s.connectFormLabel}>Yetenekler</Text><Field value={profile.skills} onChangeText={v=>update('skills',v)} placeholder="Tasarım, video, yazılım…" />
    <Text style={s.connectFormLabel}>İlgi alanları</Text><Field value={profile.interests} onChangeText={v=>update('interests',v)} placeholder="Teknoloji, fotoğraf, müzik…" />
    <Pressable onPress={()=>update('is_private',!profile.is_private)} style={s.profilePrivacyRow}><View style={s.profilePrivacyIcon}><Ionicons name={profile.is_private?'lock-closed-outline':'globe-outline'} size={18} color={C.accent}/></View><View style={{flex:1}}><Text style={s.profilePrivacyTitle}>{profile.is_private?'Gizli profil':'Açık profil'}</Text><Text style={s.profilePrivacyHint}>{profile.is_private?'Profilin varsayılan olarak gizli tutulur.':'Profil bilgilerin Connect keşfinde gösterilebilir.'}</Text></View><View style={[s.profileSwitch,profile.is_private&&s.profileSwitchOn]}><View style={[s.profileSwitchKnob,profile.is_private&&s.profileSwitchKnobOn]}/></View></Pressable>
    {profileError?<Text style={s.error}>{profileError}</Text>:null}
    <Button title={saving?'Kaydediliyor…':'Profili kaydet'} onPress={saveProfile} disabled={saving}/>
   </>}
  </Card>
  <Heading title="Kişisel hafıza" hint="TOZRA BAĞLAMI"/>
  <Card><Text style={s.muted}>TOZRA'nın yanıtlarında kullanmak istediğin tercih veya proje bağlamlarını sakla.</Text><Field value={memory} onChangeText={setMemory} placeholder="Hatırlanmasını istediğin not…" multiline/><Button title="Hafızaya ekle" onPress={()=>{const value=memory.trim();if(!value)return;if(/api[_ -]?key|password|şifre|parola|secret|token|kimlik numarası|kart numarası|açık adres|telefon numaram|hastalık|teşhis|ilaç|sağlık durumum|siyasi görüş|dinim|ırkım/i.test(value)){Alert.alert('Bu bilgi kaydedilemez','Şifre, kimlik, adres ve hassas kişisel bilgileri hafızaya ekleme.');return;}setData(v=>({...v,memories:[...v.memories,value]}));setMemory('');}}/>{data.memories.map((m,i)=><View key={i} style={s.memoryRow}><Text style={[s.taskText,{flex:1}]}>{m}</Text><Pressable onPress={()=>setData(v=>({...v,memories:v.memories.filter((_,j)=>j!==i)}))}><Ionicons name="close" color={C.faint}/></Pressable></View>)}</Card>
  <Heading title="Hesap"/><Card><Text style={s.muted}>Güvenli oturum · Supabase Auth</Text><Text style={s.muted}>Native uygulama · Android ve iOS</Text><Text style={s.muted}>TOZRA Connect · Profil altyapısı</Text></Card>
  <Button title="Çıkış yap" secondary icon="log-out-outline" onPress={()=>Alert.alert('Çıkış yapılsın mı?','TOZRA hesabından çıkış yapacaksın.',[{text:'Vazgeç',style:'cancel'},{text:'Çıkış yap',style:'destructive',onPress:onSignOut}])}/>
  <Text style={s.foot}>TOZRA · Creative Intelligence</Text>
 </ScrollView>;
}
function MainApp({session}) {
 const [tab,setTab]=useState('home'),[data,setData]=useState({tasks:[],notes:'',week:{},chat:[],projects:[],events:[],memories:[],profileAvatar:null,connectFollowing:[]}),[ready,setReady]=useState(false),[initialPrompt,setInitialPrompt]=useState(''),[projectContext,setProjectContext]=useState('');
 const cloudDataRef=useRef({});const screenAnim=useRef(new Animated.Value(1)).current;useEffect(()=>{screenAnim.setValue(0);Animated.timing(screenAnim,{toValue:1,duration:260,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();},[tab]);
 useEffect(()=>{let active=true;(async()=>{try{
   const entries=await Promise.all(Object.entries(STORE).map(async([k,v])=>[k,await AsyncStorage.getItem(scopedKey(session.user.id,v))]));
   if(!active)return;
   const next={tasks:[],notes:'',week:{},chat:[],chatSessions:[],currentChatId:null,projects:[],events:[],memories:[],profileAvatar:null,connectFollowing:[]};
   for(const [k,v] of entries)if(v!==null){try{const parsed=JSON.parse(v);if(k==='calendar')next.events=parsed.events||[];else next[k]=parsed;}catch{}}
   // Migrate the original first-release local keys without discarding existing work.
   const legacy=[['tasks','tozra.mobile.tasks.v1'],['notes','tozra.mobile.notes.v1'],['week','tozra.mobile.week.v1'],['chat','tozra.mobile.chat.v1']];
   for(const [key,oldKey] of legacy){if((key==='notes'?next.notes==='':Array.isArray(next[key])?next[key].length===0:Object.keys(next[key]||{}).length===0)){const raw=await AsyncStorage.getItem(oldKey);if(raw!==null){try{next[key]=JSON.parse(raw);}catch{}}}}
   const sb=getSupabase();
   const {data:row,error}=await sb.from('user_data').select('data,updated_at').eq('user_id',session.user.id).maybeSingle();
   if(error)throw error;
   cloudDataRef.current=row?.data&&typeof row.data==='object'?row.data:{};
   if(row?.data){const cloud=cloudDataRef.current;
     if(Array.isArray(cloud['tozra-projects']))next.projects=cloud['tozra-projects'];
     const calendar=cloud.ircal_tasks_calendar_v1;if(calendar&&typeof calendar==='object'){next.tasks=Array.isArray(calendar.tasks)?calendar.tasks:next.tasks;next.events=Array.isArray(calendar.events)?calendar.events:next.events;}
     if(!calendar&&Array.isArray(cloud['tozra-web-home-tasks-v1']))next.tasks=cloud['tozra-web-home-tasks-v1'];
     if(typeof cloud['tozra-web-home-notes-v1']==='string')next.notes=cloud['tozra-web-home-notes-v1'];
     if(cloud['tozra-web-home-week-v1']&&typeof cloud['tozra-web-home-week-v1']==='object')next.week=cloud['tozra-web-home-week-v1'];
     const conversations=cloud['tozra-conversations'];if(Array.isArray(conversations)&&conversations.length){next.chatSessions=conversations;const latest=conversations[0];if(Array.isArray(latest?.messages)){next.chat=latest.messages;next.currentChatId=latest.id||null;}}
     const memories=cloud['tozra-personal-memory-v1'];if(Array.isArray(memories))next.memories=memories.map(x=>typeof x==='string'?x:x?.content).filter(Boolean);
     if(typeof cloud['tozra-profile-avatar-v1']==='string')next.profileAvatar=cloud['tozra-profile-avatar-v1'];
     if(Array.isArray(cloud['tozra-connect-following-v1']))next.connectFollowing=cloud['tozra-connect-following-v1'];
   }
   setData(next);
   if(!row){const payload={...cloudDataRef.current,'tozra-projects':next.projects,ircal_tasks_calendar_v1:{tasks:next.tasks,events:next.events},'tozra-web-home-notes-v1':next.notes,'tozra-web-home-week-v1':next.week,'tozra-conversations':next.chatSessions.length?next.chatSessions:(next.chat.length?[{id:next.chat[0]?.id||Date.now(),title:next.chat.find(m=>m.role==='user')?.content?.slice(0,35)||'Yeni sohbet',messages:next.chat}]:[]),'tozra-personal-memory-v1':next.memories.map((content,i)=>({id:`mobile-${i}`,content,category:'genel',createdAt:Date.now()})),
       'tozra-profile-avatar-v1':next.profileAvatar||null,'tozra-connect-following-v1':next.connectFollowing||[]};
     const {error:upsertError}=await sb.from('user_data').upsert({user_id:session.user.id,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(upsertError)throw upsertError;cloudDataRef.current=payload;
   }
  }catch(e){console.warn('TOZRA cloud sync unavailable; local storage remains active:',e.message);}finally{if(active)setReady(true);}})();return()=>{active=false;};},[session.user.id]);
 useEffect(()=>{if(!ready)return;const writes=[['tasks',data.tasks],['notes',data.notes],['week',data.week],['chat',data.chat],['projects',data.projects],['calendar',{tasks:data.tasks,events:data.events}],['memories',data.memories],['profileAvatar',data.profileAvatar],['connectFollowing',data.connectFollowing||[]]];writes.forEach(([k,v])=>AsyncStorage.setItem(scopedKey(session.user.id,STORE[k]),JSON.stringify(v)).catch(e=>console.warn('TOZRA save failed',k,e)));
   const timer=setTimeout(async()=>{try{const payload={...cloudDataRef.current,'tozra-projects':data.projects,ircal_tasks_calendar_v1:{tasks:data.tasks,events:data.events},'tozra-web-home-tasks-v1':data.tasks,'tozra-web-home-notes-v1':data.notes,'tozra-web-home-week-v1':data.week,'tozra-conversations':data.chatSessions.length?data.chatSessions:(data.chat.length?[{id:data.chat[0]?.id||Date.now(),title:data.chat.find(m=>m.role==='user')?.content?.slice(0,35)||'Yeni sohbet',messages:data.chat}]:[]),'tozra-personal-memory-v1':data.memories.map((content,i)=>({id:`mobile-${i}`,content,category:'genel',createdAt:Date.now()})),
       'tozra-profile-avatar-v1':data.profileAvatar||null,'tozra-connect-following-v1':data.connectFollowing||[]};const {error}=await getSupabase().from('user_data').upsert({user_id:session.user.id,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;cloudDataRef.current=payload;}catch(e){console.warn('TOZRA cloud save failed:',e.message);}},900);
   return()=>clearTimeout(timer);
 },[data,ready,session.user.id]);
 function openChat(prompt,context=''){setInitialPrompt(prompt||'');setProjectContext(context);setTab('chat');}
 async function signOut(){await getSupabase().auth.signOut();}
 if(!ready)return <View style={s.loading}><Brand/><ActivityIndicator color={C.accent} style={{marginTop:20}}/></View>;
 return <SafeAreaView style={s.safe} edges={['top']}><View style={s.topBar}><Brand small/><Pressable onPress={()=>setTab('profile')} style={s.avatarMini}>{data.profileAvatar?<Image source={{uri:data.profileAvatar}} style={s.avatarMiniImage}/>:<Ionicons name="person-outline" color={C.text} size={17}/>}</Pressable></View><Animated.View style={{flex:1,opacity:screenAnim,transform:[{translateY:screenAnim.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}}>{tab==='home'?<HomeScreen data={data} setData={setData} onTab={setTab}/>:tab==='chat'?<ChatScreen session={session} data={data} setData={setData} initialPrompt={initialPrompt} setInitialPrompt={setInitialPrompt} projectContext={projectContext}/>:tab==='projects'?<ProjectsScreen data={data} setData={setData} session={session} onOpenChat={p=>openChat(p)}/>:tab==='studio'?<StudioScreen session={session} data={data} setData={setData} onOpenChat={p=>openChat(p)}/>:tab==='tasks'?<TasksScreen data={data} setData={setData}/>:tab==='web'?<TozraWebScreen onOpenChat={p=>openChat(p,'TOZRA Web sitesi oluşturma briefi. Kullanıcıya site mimarisi, tasarım sistemi ve tek dosyalık HTML/CSS/JS çıktısı hazırla; çalıştırılabilir olduğunu iddia etmeden kodu açıkça ver.')}/>:tab==='connect'?<ConnectScreen user={session.user} data={data} setData={setData} onMessage={p=>openChat(p,'TOZRA Connect üzerinden başlatılan iletişim. Henüz gerçek kullanıcılar arası mesajlaşma servisi bağlı değil; mesaj taslağı hazırla.')}/>:<ProfileScreen user={session.user} onSignOut={signOut} data={data} setData={setData}/>}</Animated.View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabBar}>{TABS.map(t=><Pressable key={t[0]} onPress={()=>setTab(t[0])} style={[s.tabItem,tab===t[0]&&s.tabItemActive]}><Ionicons name={tab===t[0]?t[3]:t[2]} size={19} color={tab===t[0]?C.accent:C.faint}/><Text style={[s.tabLabel,tab===t[0]&&{color:C.accent}]}>{t[1]}</Text></Pressable>)}</ScrollView></SafeAreaView>;
}


function CinematicIntro({onDone}) {
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  Animated.timing(progress,{toValue:1,duration:4700,easing:Easing.inOut(Easing.cubic),useNativeDriver:true}).start(({finished})=>{if(finished)onDone();});
 },[]);
 const spin=progress.interpolate({inputRange:[0,1],outputRange:['-35deg','325deg']});
 const scale=progress.interpolate({inputRange:[0,.35,.7,1],outputRange:[.72,1.08,1,1]});
 const opacity=progress.interpolate({inputRange:[0,.12,.82,1],outputRange:[0,1,1,0]});
 const line=progress.interpolate({inputRange:[0,.35,.7,1],outputRange:[0,1,1,1]});
 return <View style={s.introScreen}>
  <Animated.View style={[s.introGlow,{opacity,transform:[{scale}]}]}/>
  <Animated.View style={[s.introOrbit,{opacity,transform:[{rotate:spin}]}]}><View style={s.introOrbitDot}/></Animated.View>
  <Animated.View style={[s.introOrbitInner,{opacity,transform:[{rotate:spin}]}]}><View style={s.introOrbitDotSmall}/></Animated.View>
  <Animated.View style={{opacity,alignItems:'center',transform:[{scale}]}}>
   <View style={s.introMark}><Text style={s.introMarkText}>T</Text></View>
   <Text style={s.introWord}>TOZRA</Text>
   <Text style={s.introSub}>CREATIVE INTELLIGENCE</Text>
  </Animated.View>
  <View style={s.introBottom}><View style={s.introLine}><Animated.View style={[s.introLineFill,{width:line.interpolate?line.interpolate({inputRange:[0,1],outputRange:['0%','100%']}):'100%'}]}/></View><Text style={s.introCaption}>A NEW SPACE TO CREATE</Text></View>
 </View>;
}

export default function App(){const [introDone,setIntroDone]=useState(false),[clientReady,setClientReady]=useState(false),[bootError,setBootError]=useState(''),[session,setSession]=useState(null),[authChecked,setAuthChecked]=useState(false);useEffect(()=>{let sub,mounted=true;(async()=>{try{const sb=await initializeSupabase();const {data}=await sb.auth.getSession();if(!mounted)return;setSession(data.session);const r=sb.auth.onAuthStateChange((_e,next)=>{if(mounted)setSession(next);});sub=r.data.subscription;setClientReady(true);}catch(e){if(mounted)setBootError(e.message||'Başlatma hatası');}finally{if(mounted)setAuthChecked(true);}})();return()=>{mounted=false;sub?.unsubscribe();};},[]);return <SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor={C.bg}/><ExpoStatusBar style="light"/>{!introDone?<CinematicIntro onDone={()=>setIntroDone(true)}/>:!authChecked?<View style={s.loading}><Brand/><ActivityIndicator color={C.accent} style={{marginTop:20}}/><Text style={s.muted}>TOZRA hazırlanıyor…</Text></View>:bootError?<SafeAreaView style={s.safe}><View style={s.errorScreen}><Brand/><Text style={s.authTitle}>Bağlantı kurulamadı</Text><Text style={s.muted}>{bootError}</Text><Button title="Yeniden dene" onPress={()=>{setAuthChecked(false);setBootError('');initializeSupabase().then(async()=>{const {data}=await getSupabase().auth.getSession();setSession(data.session);setClientReady(true);setAuthChecked(true);}).catch(e=>{setBootError(e.message);setAuthChecked(true);});}}/></View></SafeAreaView>:session?<MainApp session={session}/>:clientReady?<AuthScreen onReady={setSession}/>:<AuthScreen onReady={setSession}/>}</SafeAreaProvider>;}

const PREMIUM = {};

const s=StyleSheet.create({
 ...PREMIUM,
 safe:{flex:1,backgroundColor:C.bg},loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'},authWrap:{flexGrow:1,justifyContent:'center',padding:24,paddingTop:40,paddingBottom:40},brandRow:{flexDirection:'row',alignItems:'center',gap:10},brandMark:{width:42,height:42,borderRadius:14,backgroundColor:'#28261F',borderWidth:1,borderColor:'#78694F',alignItems:'center',justifyContent:'center'},brandLetter:{color:'#D4C2A0',fontSize:25,fontWeight:'900'},brandName:{color:C.text,fontSize:21,fontWeight:'900',letterSpacing:2},brandSub:{color:C.faint,fontSize:7,letterSpacing:2,marginTop:2},eyebrow:{color:C.accent,fontSize:9,fontWeight:'900',letterSpacing:1.5},authTitle:{color:C.text,fontSize:31,fontWeight:'850',marginTop:12,marginBottom:9},muted:{color:C.muted,fontSize:12,lineHeight:19,marginTop:7},foot:{color:C.faint,textAlign:'center',fontSize:9,marginTop:22},card:{backgroundColor:C.surface,borderColor:C.line,borderWidth:1,borderRadius:18,padding:15,marginBottom:16},cardTitle:{color:C.text,fontWeight:'800',fontSize:15,marginBottom:10},field:{backgroundColor:C.surface2,borderWidth:1,borderColor:C.line,borderRadius:12,color:C.text,minHeight:47,paddingHorizontal:13,paddingVertical:11,fontSize:12,marginBottom:10},button:{backgroundColor:C.accent,minHeight:47,borderRadius:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,paddingHorizontal:15,marginTop:5},buttonSecondary:{backgroundColor:C.surface2,borderWidth:1,borderColor:C.line},buttonText:{color:'#10150D',fontSize:12,fontWeight:'900'},error:{color:C.danger,fontSize:11,marginVertical:8},safeArea:{flex:1},topBar:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},avatarMini:{width:35,height:35,borderRadius:12,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarMiniImage:{width:35,height:35,borderRadius:12},page:{padding:17,paddingBottom:30},hero:{backgroundColor:'#211F1A',borderWidth:1,borderColor:'#5A5143',borderRadius:21,padding:18,marginBottom:16},heroTitle:{color:C.text,fontSize:26,fontWeight:'850',lineHeight:32,marginTop:12,marginBottom:7},askBar:{height:48,borderRadius:12,borderWidth:1,borderColor:'#5A5143',backgroundColor:'#171715',marginTop:17,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:9},askText:{color:C.muted,fontSize:12,flex:1},stats:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:15,padding:14,flexDirection:'row',justifyContent:'space-around',marginBottom:23},stat:{alignItems:'center',flex:1},statNum:{color:C.text,fontSize:21,fontWeight:'850'},statLabel:{color:C.faint,fontSize:8,letterSpacing:.7,marginTop:4,fontWeight:'800'},heading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10,marginTop:5},headingText:{color:C.text,fontSize:16,fontWeight:'800'},hint:{color:C.faint,fontSize:8,letterSpacing:1,fontWeight:'800'},quickGrid:{gap:8,marginBottom:20},quickCard:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:14,padding:14,flexDirection:'row',alignItems:'center',gap:12},quickText:{color:C.text,fontSize:12,fontWeight:'700',flex:1},addRow:{flexDirection:'row',alignItems:'center',gap:8},addButton:{width:46,height:46,borderRadius:12,backgroundColor:C.accent2,alignItems:'center',justifyContent:'center'},empty:{color:C.faint,fontSize:11,textAlign:'center',paddingVertical:14},smallMuted:{color:C.faint,fontSize:9,lineHeight:14,marginTop:4},taskRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11,borderTopWidth:1,borderTopColor:C.line},check:{width:20,height:20,borderRadius:7,borderWidth:1.5,borderColor:C.faint,alignItems:'center',justifyContent:'center'},checkDone:{backgroundColor:C.accent2,borderColor:C.accent2},taskText:{color:C.text,fontSize:12},calendarGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-start'},calendarWeek:{width:'14.285%',textAlign:'center',color:C.faint,fontSize:10,paddingVertical:9},calendarDay:{width:'14.285%',height:42,alignItems:'center',justifyContent:'center',borderRadius:10},calendarDayActive:{backgroundColor:C.accent2},calendarDayText:{color:C.text,fontSize:11,fontWeight:'700'},calendarDot:{width:4,height:4,borderRadius:3,backgroundColor:C.accent,marginTop:2},monthHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14},selectedDateRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:13},smallAction:{flexDirection:'row',alignItems:'center',gap:4,padding:8,backgroundColor:C.surface2,borderRadius:9},accentText:{color:C.accent,fontSize:10,fontWeight:'800'},chip:{paddingHorizontal:11,paddingVertical:8,borderRadius:10,backgroundColor:C.surface2,borderWidth:1,borderColor:C.line},chipActive:{backgroundColor:'#302D27',borderColor:'#78694F'},chipText:{color:C.muted,fontSize:10,fontWeight:'700'},chipTextActive:{color:'#E5D9C4'},screen:{flex:1,paddingHorizontal:15,paddingTop:12,paddingBottom:8},screenHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingBottom:12,borderBottomWidth:1,borderBottomColor:C.line},screenTitle:{color:C.text,fontSize:24,fontWeight:'850',marginTop:4},messageList:{flexGrow:1,paddingVertical:14,gap:10},chatWelcome:{flex:1,minHeight:300,alignItems:'center',justifyContent:'center',paddingHorizontal:12},chatSpark:{width:54,height:54,borderRadius:18,backgroundColor:'#302D27',alignItems:'center',justifyContent:'center',marginBottom:15},suggestion:{width:'100%',padding:12,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.surface,flexDirection:'row',justifyContent:'space-between',marginTop:8},suggestionText:{color:C.muted,fontSize:11},bubble:{maxWidth:'92%',borderRadius:15,padding:12},userBubble:{alignSelf:'flex-end',backgroundColor:'#38342D',borderBottomRightRadius:4},aiBubble:{alignSelf:'flex-start',backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderBottomLeftRadius:4},messageRole:{color:C.accent,fontSize:8,fontWeight:'900',letterSpacing:1,marginBottom:5},messageText:{color:C.text,fontSize:12,lineHeight:19},busyRow:{flexDirection:'row',alignItems:'center',gap:9},composer:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:15,padding:8},attachRow:{flexDirection:'row',gap:16,paddingHorizontal:7,paddingBottom:5},composerInput:{color:C.text,minHeight:38,maxHeight:100,paddingHorizontal:8,paddingTop:7,fontSize:12},sendButton:{position:'absolute',right:8,bottom:8,width:37,height:37,borderRadius:11,backgroundColor:C.accent2,alignItems:'center',justifyContent:'center'},disclaimer:{color:C.faint,fontSize:8,textAlign:'center',paddingTop:6},mediaChip:{flexDirection:'row',alignItems:'center',gap:7,padding:8,backgroundColor:C.surface2,borderRadius:10,marginRight:8},modeRow:{gap:8,paddingVertical:17},modeCard:{minWidth:115,padding:12,borderRadius:13,borderWidth:1,borderColor:C.line,backgroundColor:C.surface,alignItems:'center',gap:7},modeCardActive:{borderColor:C.accent,backgroundColor:'#302D27'},modeText:{color:C.muted,fontSize:9,fontWeight:'800',textAlign:'center'},projectCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:15,padding:14,marginBottom:9},projectIcon:{width:42,height:42,borderRadius:12,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center'},projectHero:{paddingVertical:18},back:{flexDirection:'row',alignItems:'center',gap:4,paddingVertical:8},tabScroll:{maxHeight:68,borderTopWidth:1,borderTopColor:C.line,backgroundColor:'#171715'},historyRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:9,borderTopWidth:1,borderTopColor:C.line},tabItem:{minWidth:65,alignItems:'center',justifyContent:'center',gap:4,paddingHorizontal:7,paddingVertical:8},tabItemActive:{backgroundColor:'#302D27',borderRadius:12},tabLabel:{color:C.faint,fontSize:8,fontWeight:'800'},profileHero:{alignItems:'center',paddingVertical:25},connectFormLabel:{color:C.muted,fontSize:10,fontWeight:'800',marginTop:8,marginBottom:5},profilePrivacyRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:13,borderTopWidth:1,borderTopColor:C.line,marginTop:8},profilePrivacyIcon:{width:34,height:34,borderRadius:11,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center'},profilePrivacyTitle:{color:C.text,fontSize:12,fontWeight:'800'},profilePrivacyHint:{color:C.faint,fontSize:9,lineHeight:14,marginTop:3},profileSwitch:{width:42,height:24,borderRadius:14,backgroundColor:C.surface2,justifyContent:'center',padding:3,borderWidth:1,borderColor:C.line},profileSwitchOn:{backgroundColor:C.accent2,borderColor:C.accent2},profileSwitchKnob:{width:16,height:16,borderRadius:8,backgroundColor:C.muted},profileSwitchKnobOn:{alignSelf:'flex-end',backgroundColor:'#171715'},profileAvatarButton:{width:88,height:88,marginBottom:12,position:'relative',alignItems:'center',justifyContent:'center'},profileAvatarImage:{width:88,height:88,borderRadius:30,borderWidth:2,borderColor:'#78694F'},avatarEditBadge:{position:'absolute',right:-2,bottom:-2,width:28,height:28,borderRadius:10,backgroundColor:C.accent,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:C.bg},removeAvatarAction:{paddingVertical:8},removeAvatarText:{color:C.danger,fontSize:10,fontWeight:'800'},avatar:{width:68,height:68,borderRadius:23,backgroundColor:'#302D27',alignItems:'center',justifyContent:'center',marginBottom:12},memoryRow:{flexDirection:'row',alignItems:'center',gap:8,borderTopWidth:1,borderTopColor:C.line,paddingVertical:10},foot:{color:C.faint,textAlign:'center',fontSize:9,marginTop:18},tabBar:{flexDirection:'row',gap:4},
 errorScreen:{flex:1,justifyContent:'center',padding:24},
 introScreen:{flex:1,backgroundColor:'#111211',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 introGlow:{position:'absolute',width:250,height:250,borderRadius:125,backgroundColor:'#3A3328',opacity:.55},
 introOrbit:{position:'absolute',width:210,height:210,borderRadius:105,borderWidth:1,borderColor:'#75664E'},
 introOrbitInner:{position:'absolute',width:158,height:158,borderRadius:79,borderWidth:1,borderColor:'#514A3D'},
 introOrbitDot:{position:'absolute',top:18,right:22,width:9,height:9,borderRadius:5,backgroundColor:'#D4C2A0'},
 introOrbitDotSmall:{position:'absolute',bottom:15,left:18,width:6,height:6,borderRadius:3,backgroundColor:'#B6A17C'},
 introMark:{width:76,height:76,borderRadius:25,backgroundColor:'#28261F',borderWidth:1,borderColor:'#78694F',alignItems:'center',justifyContent:'center'},
 introMarkText:{color:'#D4C2A0',fontSize:46,fontWeight:'800'},
 introWord:{color:'#F2F0EA',fontSize:30,fontWeight:'900',letterSpacing:8,marginTop:18,marginLeft:8},
 introSub:{color:'#A69A85',fontSize:8,fontWeight:'700',letterSpacing:3,marginTop:8},
 introBottom:{position:'absolute',bottom:54,left:48,right:48,alignItems:'center'},
 introLine:{width:'100%',height:2,backgroundColor:'#38352F',borderRadius:2,overflow:'hidden'},
 introLineFill:{height:2,backgroundColor:'#D4C2A0'},
 introCaption:{color:'#8D8578',fontSize:8,letterSpacing:2,marginTop:13,fontWeight:'700'},

 connectScreen:{flex:1,backgroundColor:C.bg},connectContent:{padding:18,paddingBottom:28},connectHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},connectEyebrow:{fontSize:8,fontWeight:'900',letterSpacing:2.2,color:C.accent},connectTitle:{fontSize:30,fontWeight:'900',color:C.text,letterSpacing:-.8,marginTop:4},connectSubtitle:{fontSize:11,color:C.muted,marginTop:4},connectHeaderIcon:{width:48,height:48,borderRadius:17,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},connectStats:{flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:18,paddingVertical:15,marginBottom:13},connectStat:{flex:1,alignItems:'center'},connectStatValue:{fontSize:19,fontWeight:'900',color:C.text},connectStatLabel:{fontSize:9,color:C.muted,marginTop:3},connectStatDivider:{width:1,height:28,backgroundColor:C.line},connectQuickActions:{flexDirection:'row',gap:10,marginBottom:18},connectQuickCard:{flex:1,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:17,padding:13},connectQuickIcon:{width:34,height:34,borderRadius:12,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center',marginBottom:9},connectQuickTitle:{fontSize:12,fontWeight:'800',color:C.text},connectQuickHint:{fontSize:9,color:C.muted,marginTop:3},connectSectionTabs:{flexDirection:'row',backgroundColor:C.surface2,borderRadius:13,padding:4,marginBottom:18},connectSectionTab:{flex:1,paddingVertical:9,alignItems:'center',borderRadius:10},connectSectionTabActive:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line},connectSectionTabText:{fontSize:9,color:C.faint,fontWeight:'700'},connectSectionTabTextActive:{color:C.text},connectSearch:{flexDirection:'row',alignItems:'center',gap:9,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:13,paddingHorizontal:12,marginBottom:18},connectSearchInput:{flex:1,color:C.text,fontSize:11,paddingVertical:13},connectSectionHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},connectHeading:{fontSize:15,fontWeight:'900',color:C.text,marginBottom:10},connectMuted:{fontSize:9,color:C.faint},connectPersonCard:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:16,padding:11,marginBottom:9},connectPersonAvatar:{width:43,height:43,borderRadius:15,alignItems:'center',justifyContent:'center',position:'relative'},connectPersonInitials:{fontSize:12,fontWeight:'900',color:'#F4F0E8'},connectOnlineDot:{position:'absolute',right:-1,bottom:-1,width:10,height:10,borderRadius:5,backgroundColor:'#8DAD8D',borderWidth:2,borderColor:C.surface},connectPersonInfo:{flex:1,minWidth:0},connectPersonName:{fontSize:11,fontWeight:'800',color:C.text},connectPersonHandle:{fontSize:8,color:C.muted,marginTop:3},connectTags:{flexDirection:'row',gap:5,marginTop:6},connectTag:{backgroundColor:C.surface2,borderRadius:6,paddingHorizontal:7,paddingVertical:4},connectTagText:{fontSize:7,color:C.muted,fontWeight:'700'},connectFollowButton:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:C.accent,borderRadius:9,paddingHorizontal:9,paddingVertical:8},connectFollowingButton:{backgroundColor:C.surface2,borderWidth:1,borderColor:C.line},connectFollowText:{fontSize:8,fontWeight:'900',color:C.bg},connectFollowingText:{color:C.text},connectDisclaimer:{fontSize:9,color:C.faint,lineHeight:15,marginTop:5},connectEmpty:{fontSize:10,color:C.muted,lineHeight:17,backgroundColor:C.surface,borderRadius:14,padding:15},connectSmallAction:{backgroundColor:C.surface2,borderRadius:9,paddingHorizontal:10,paddingVertical:8},connectSmallActionText:{fontSize:8,color:C.text,fontWeight:'800'},connectFeaturePanel:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:20,padding:20,alignItems:'center',marginTop:4},connectFeatureIcon:{width:58,height:58,borderRadius:20,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center',marginBottom:13},connectFeatureTitle:{fontSize:17,fontWeight:'900',color:C.text},connectFeatureText:{fontSize:10,color:C.muted,textAlign:'center',lineHeight:17,marginTop:8,marginBottom:17},connectPrimaryAction:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:C.accent,borderRadius:12,paddingHorizontal:16,paddingVertical:12},connectPrimaryActionText:{fontSize:10,fontWeight:'900',color:C.bg},connectMeetingRow:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.surface2,borderRadius:10,padding:10,marginBottom:16,width:'100%'},connectMeetingText:{fontSize:9,color:C.muted,flex:1},connectFooter:{alignItems:'center',paddingTop:20},connectFooterText:{fontSize:7,letterSpacing:2,color:C.faint,fontWeight:'800'}

});
