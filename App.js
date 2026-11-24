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
import WorkspaceModules from './src/WorkspaceModules';

const STORE = { tasks: 'tasks.v2', notes: 'notes.v2', week: 'week.v2', chat: 'chat.v2', projects: 'projects.v2', calendar: 'calendar.v2', memories: 'memories.v2', workspace: 'workspace.v1' };
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const TABS = [
  ['home','Ana sayfa','grid-outline','grid'], ['chat','Sohbet','chatbubble-ellipses-outline','chatbubble-ellipses'],
  ['projects','Projeler','folder-open-outline','folder-open'], ['studio','Studio','color-wand-outline','color-wand'],
  ['tasks','Takvim','calendar-outline','calendar'], ['web','TOZRA Web','globe-outline','globe'], ['atlas','Atlas','map-outline','map'], ['nexus','Nexus','git-network-outline','git-network'], ['universe','Universe','planet-outline','planet'], ['market','Market','storefront-outline','storefront'], ['social','Social','people-outline','people'], ['profile','Hesap','person-circle-outline','person-circle']
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
function Button({title,onPress,secondary=false,disabled=false,icon}) { return <Pressable onPress={onPress} disabled={disabled} style={[s.button,secondary&&s.buttonSecondary,disabled&&{opacity:.45}]}>{icon?<Ionicons name={icon} size={17} color={secondary?C.text:'#171512'}/>:null}<Text style={[s.buttonText,secondary&&{color:C.text}]}>{title}</Text></Pressable>; }
function Chip({label,active,onPress}) { return <Pressable onPress={onPress} style={[s.chip,active&&s.chipActive]}><Text style={[s.chipText,active&&s.chipTextActive]}>{label}</Text></Pressable>; }

function IntroSplash({onFinish}) {
 const surgeScale = useRef(new Animated.Value(0.35)).current;
 const surgeOpacity = useRef(new Animated.Value(0)).current;
 const flashOpacity = useRef(new Animated.Value(0)).current;
 const subOpacity = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  Animated.sequence([
   // Crisp instant snap-in of TOZRA mark
   Animated.parallel([
    Animated.timing(surgeOpacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.spring(surgeScale, { toValue: 1.04, friction: 6, tension: 190, useNativeDriver: true }),
    Animated.timing(subOpacity, { toValue: 1, duration: 240, delay: 90, useNativeDriver: true })
   ]),
   // Brief hold so brand mark registers cleanly
   Animated.delay(420),
   // Sudden dramatic scale-burst / zoom-surge into screen reveal
   Animated.parallel([
    Animated.timing(surgeScale, { toValue: 14, duration: 420, easing: Easing.in(Easing.exp), useNativeDriver: true }),
    Animated.timing(surgeOpacity, { toValue: 0, duration: 360, delay: 60, useNativeDriver: true }),
    Animated.timing(subOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    Animated.sequence([
     Animated.timing(flashOpacity, { toValue: 0.85, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
     Animated.timing(flashOpacity, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ])
   ])
  ]).start(({ finished }) => {
   if (finished) onFinish();
  });
 }, []);

 return (
  <View style={s.splashBurstRoot}>
   <Animated.View style={[s.splashBurstFlash, { opacity: flashOpacity }]} pointerEvents="none" />
   <Animated.View style={[s.splashBurstMarkWrap, { opacity: surgeOpacity, transform: [{ scale: surgeScale }] }]}>
    <View style={s.splashBurstBadge}>
     <Text style={s.splashBurstGlyph}>T</Text>
    </View>
    <Text style={s.splashBurstWordmark}>TOZRA</Text>
   </Animated.View>
   <Animated.View style={[s.splashBurstSubWrap, { opacity: subOpacity }]}>
    <Text style={s.splashBurstTag}>CREATIVE INTELLIGENCE</Text>
   </Animated.View>
  </View>
 );
}

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

function HomeScreen({data,setData,onTab,onOpenChat,session}) {
 const [promptInput,setPromptInput]=useState('');
 const [newTask,setNewTask]=useState('');
 const [day,setDay]=useState((new Date().getDay()+6)%7);
 const done=data.tasks.filter(x=>x.done).length;
 const todayTasks=data.tasks.filter(x=>x.date===dateKey());
 const progress=data.tasks.length?Math.round(done/data.tasks.length*100):0;
 const rawName=session?.user?.user_metadata?.full_name||session?.user?.user_metadata?.name||data.profileName||'';
 const firstName=String(rawName).trim().split(/\s+/)[0];
 const recentChats=(data.chatSessions||[]).slice(0,3);

 const shortcuts=[
  {id:'chat',label:'AI Chat',icon:'chatbubble-ellipses-outline',active:true},
  {id:'studio',label:'Studio',icon:'layers-outline'},
  {id:'projects',label:'Projeler',icon:'folder-open-outline'},
  {id:'tasks',label:'Takvim',icon:'calendar-outline'}
 ];

 const quickAccess=[
  {id:'idea',title:'Fikir Geliştir',sub:'Yeni fikirler üret',icon:'bulb-outline',action:()=>onOpenChat?onOpenChat('Yeni bir fikir geliştirmek istiyorum. Bana yardımcı ol.'):onTab('chat')},
  {id:'projects',title:'Projelerim',sub:'Çalışmalarını yönet',icon:'folder-open-outline',action:()=>onTab('projects')},
  {id:'studio',title:'Creative Studio',sub:'İçeriklerini tasarla',icon:'color-palette-outline',action:()=>onTab('studio')},
  {id:'tasks',title:'Takvim',sub:'Planlarını düzenle',icon:'calendar-outline',action:()=>onTab('tasks')}
 ];

 const allModules=[
  {id:'atlas',title:'Atlas',icon:'map-outline'},
  {id:'nexus',title:'Nexus',icon:'git-network-outline'},
  {id:'universe',title:'Universe',icon:'planet-outline'},
  {id:'market',title:'Market',icon:'storefront-outline'},
  {id:'social',title:'Social',icon:'people-outline'},
  {id:'web',title:'TOZRA Web',icon:'globe-outline'}
 ];

 function handlePromptSubmit(){
  const val=promptInput.trim();
  if(!val){onTab('chat');return;}
  setPromptInput('');
  if(onOpenChat)onOpenChat(val);
  else onTab('chat');
 }

 function add(){
  const title=newTask.trim();
  if(!title)return;
  setData(v=>({...v,tasks:[{id:uid(),title,date:dateKey(),priority:'normal',done:false},...v.tasks]}));
  setNewTask('');
 }

 return <ScrollView contentContainerStyle={s.trhPage} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
  {/* Ambient organic glow layers */}
  <View style={s.trhGlowLeft} pointerEvents="none"/>
  <View style={s.trhGlowRight} pointerEvents="none"/>

  {/* Top Navigation Pills */}
  <View style={s.trhShortcuts}>
   {shortcuts.map(item=>(
    <Pressable key={item.id} onPress={()=>onTab(item.id)} style={[s.trhShortcut,item.active&&s.trhShortcutActive]}>
     <Ionicons name={item.icon} size={17} color={item.active?'#285C30':'#191D1A'}/>
     <Text numberOfLines={1} style={[s.trhShortcutText,item.active&&s.trhShortcutTextActive]}>{item.label}</Text>
    </Pressable>
   ))}
  </View>

  {/* Orbital Brand Emblem */}
  <View style={s.trhOrbitWrap}>
   <View style={s.trhOrbitRing}/>
   <View style={s.trhOrbitGlow}>
    <View style={s.trhOrbitCore}>
     <Text style={s.trhOrbitLogo}>T</Text>
    </View>
   </View>
  </View>

  {/* Welcome Header */}
  <View style={s.trhWelcome}>
   <Text style={s.trhWelcomeTitle}>{firstName?`Merhaba ${firstName},`:'Merhaba!'}</Text>
   <Text style={s.trhWelcomeSub}>Bugün ne üretmek, planlamak veya keşfetmek istersin?</Text>
  </View>

  {/* Interactive Prompt Composer */}
  <View style={s.trhComposer}>
   <View style={s.trhPromptRow}>
    <Text style={s.trhSpark}>✦</Text>
    <TextInput
     value={promptInput}
     onChangeText={setPromptInput}
     placeholder="TOZRA’ya bir şey sor..."
     placeholderTextColor="#777D79"
     style={s.trhPromptInput}
     onSubmitEditing={handlePromptSubmit}
     returnKeyType="send"
    />
   </View>
   <View style={s.trhComposerTools}>
    <Pressable onPress={()=>onTab('chat')} style={s.trhToolBtn} accessibilityLabel="Dosya ekle">
     <Ionicons name="attach-outline" size={20} color="#1C2420"/>
    </Pressable>
    <Pressable onPress={()=>onTab('studio')} style={s.trhToolBtn} accessibilityLabel="Görsel ekle">
     <Ionicons name="image-outline" size={19} color="#1C2420"/>
    </Pressable>
    <Pressable onPress={()=>onTab('chat')} style={s.trhToolBtn} accessibilityLabel="Sesli mesaj">
     <Ionicons name="mic-outline" size={19} color="#1C2420"/>
    </Pressable>
    <Pressable onPress={handlePromptSubmit} style={s.trhSendBtn} accessibilityLabel="Gönder">
     <Ionicons name="arrow-up" size={22} color="#15240E"/>
    </Pressable>
   </View>
  </View>

  {/* Hızlı Erişim (Quick Access Grid) */}
  <View style={s.trhSection}>
   <View style={s.trhSectionHead}>
    <Text style={s.trhSectionTitle}>Hızlı Erişim</Text>
    <Pressable onPress={()=>onTab('studio')}>
     <Text style={s.trhSectionLink}>Tümünü Gör ›</Text>
    </Pressable>
   </View>
   <View style={s.trhQuickGrid}>
    {quickAccess.map(card=>(
     <Pressable key={card.id} onPress={card.action} style={s.trhQuickCard}>
      <View style={s.trhCardIconWrap}>
       <Ionicons name={card.icon} size={24} color="#2C7137"/>
      </View>
      <View style={{flex:1,minWidth:0}}>
       <Text numberOfLines={1} style={s.trhCardTitle}>{card.title}</Text>
       <Text numberOfLines={1} style={s.trhCardSub}>{card.sub}</Text>
      </View>
      <View style={s.trhCardArrow}>
       <Ionicons name="arrow-forward" size={14} color="#343A36"/>
      </View>
     </Pressable>
    ))}
   </View>
  </View>

  {/* Son Sohbetler (Recent Chats) */}
  <View style={s.trhSection}>
   <View style={s.trhSectionHead}>
    <Text style={s.trhSectionTitle}>Son Sohbetler</Text>
    <Pressable onPress={()=>onTab('chat')}>
     <Text style={s.trhSectionLink}>Tümünü Gör ›</Text>
    </Pressable>
   </View>
   {recentChats.length>0?recentChats.map(chat=>(
    <Pressable key={chat.id} onPress={()=>{setData(v=>({...v,currentChatId:chat.id,chat:chat.messages||[]}));onTab('chat');}} style={[s.trhRecentCard,{marginBottom:8}]}>
     <View style={s.trhRecentIcon}>
      <Ionicons name="chatbubble-ellipses-outline" size={22} color="#245F30"/>
     </View>
     <View style={{flex:1,minWidth:0}}>
      <Text numberOfLines={1} style={s.trhCardTitle}>{chat.title||'TOZRA Sohbeti'}</Text>
      <Text numberOfLines={1} style={s.trhCardSub}>Son sohbetine devam et</Text>
     </View>
     <View style={s.trhCardArrow}>
      <Ionicons name="arrow-forward" size={14} color="#343A36"/>
     </View>
    </Pressable>
   )):(
    <Pressable onPress={()=>onTab('chat')} style={s.trhRecentCard}>
     <View style={s.trhRecentIcon}>
      <Ionicons name="chatbubble-ellipses-outline" size={22} color="#245F30"/>
     </View>
     <View style={{flex:1,minWidth:0}}>
      <Text numberOfLines={1} style={s.trhCardTitle}>TOZRA proje yol haritası</Text>
      <Text numberOfLines={1} style={s.trhCardSub}>Yeni bir sohbet başlat</Text>
     </View>
     <View style={s.trhCardArrow}>
      <Ionicons name="arrow-forward" size={14} color="#343A36"/>
     </View>
    </Pressable>
   )}
  </View>

  {/* Çalışma Özeti & İlerleme */}
  <View style={s.trhSection}>
   <View style={s.trhSectionHead}>
    <Text style={s.trhSectionTitle}>Çalışma Özeti</Text>
    <Text style={s.trhBadgeText}>%{progress} TAMAMLANDI</Text>
   </View>
   <View style={s.trhStatsBox}>
    <Pressable onPress={()=>onTab('projects')} style={s.trhStatCol}>
     <Text style={s.trhStatNum}>{data.projects.length}</Text>
     <Text style={s.trhStatLabel}>PROJE</Text>
    </Pressable>
    <View style={s.trhStatSep}/>
    <Pressable onPress={()=>onTab('tasks')} style={s.trhStatCol}>
     <Text style={s.trhStatNum}>{data.tasks.length}</Text>
     <Text style={s.trhStatLabel}>GÖREV</Text>
    </Pressable>
    <View style={s.trhStatSep}/>
    <Pressable onPress={()=>onTab('tasks')} style={s.trhStatCol}>
     <Text style={[s.trhStatNum,{color:'#2C7137'}]}>{done}</Text>
     <Text style={s.trhStatLabel}>BİTEN</Text>
    </Pressable>
   </View>
   <View style={s.trhProgressTrack}>
    <View style={[s.trhProgressFill,{width:`${progress}%`}]}/>
   </View>
  </View>

  {/* Bugünün Odağı (Hızlı Görev Ekleme) */}
  <View style={s.trhSection}>
   <View style={s.trhSectionHead}>
    <Text style={s.trhSectionTitle}>Bugünün Odağı</Text>
    <Pressable onPress={()=>onTab('tasks')}>
     <Text style={s.trhSectionLink}>Takvim ›</Text>
    </Pressable>
   </View>
   <View style={s.trhLightCard}>
    <View style={s.addRow}>
     <TextInput
      value={newTask}
      onChangeText={setNewTask}
      placeholder="Yeni görevini yaz…"
      placeholderTextColor="#858A86"
      style={s.trhLightInput}
      onSubmitEditing={add}
     />
     <Pressable onPress={add} style={s.trhLightAddBtn}>
      <Ionicons name="add" color="#15240E" size={22}/>
     </Pressable>
    </View>
    {todayTasks.slice(0,4).map(t=>(
     <View key={t.id} style={s.trhTaskRow}>
      <Pressable onPress={()=>setData(v=>({...v,tasks:v.tasks.map(z=>z.id===t.id?{...z,done:!z.done}:z)}))} style={[s.trhCheck,t.done&&s.trhCheckDone]}>
       {t.done?<Ionicons name="checkmark" color="#15240E" size={13}/>:null}
      </Pressable>
      <Text style={[s.trhTaskText,t.done&&{textDecorationLine:'line-through',color:'#858A86'}]}>{t.title}</Text>
      <Pressable onPress={()=>setData(v=>({...v,tasks:v.tasks.filter(z=>z.id!==t.id)}))}>
       <Ionicons name="close" color="#858A86" size={17}/>
      </Pressable>
     </View>
    ))}
    {!todayTasks.length?<Text style={s.trhEmptyText}>Bugün için henüz görev eklenmedi.</Text>:null}
   </View>
  </View>

  {/* Diğer Modüller */}
  <View style={s.trhSection}>
   <View style={s.trhSectionHead}>
    <Text style={s.trhSectionTitle}>Ek Modüller</Text>
    <Text style={s.trhBadgeText}>WORKSPACE</Text>
   </View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
    {allModules.map(m=>(
     <Pressable key={m.id} onPress={()=>onTab(m.id)} style={s.trhMiniPill}>
      <Ionicons name={m.icon} size={16} color="#2C7137"/>
      <Text style={s.trhMiniPillText}>{m.title}</Text>
     </Pressable>
    ))}
   </ScrollView>
  </View>

  {/* Not Defteri & Haftalık Plan */}
  <View style={s.trhSection}>
   <View style={s.trhSectionHead}>
    <Text style={s.trhSectionTitle}>Hızlı Not & Haftalık Plan</Text>
   </View>
   <View style={s.trhLightCard}>
    <TextInput
     value={data.notes}
     onChangeText={v=>setData(old=>({...old,notes:v}))}
     placeholder="Aklındaki fikirleri veya notlarını buraya yaz…"
     placeholderTextColor="#858A86"
     multiline
     style={[s.trhLightInput,{minHeight:78,textAlignVertical:'top',marginBottom:12}]}
    />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,marginBottom:10}}>
     {DAYS.map((d,i)=>(
      <Pressable key={d} onPress={()=>setDay(i)} style={[s.trhDayChip,day===i&&s.trhDayChipActive]}>
       <Text style={[s.trhDayChipText,day===i&&s.trhDayChipTextActive]}>{d.slice(0,3)}</Text>
      </Pressable>
     ))}
    </ScrollView>
    <TextInput
     value={data.week[day]||''}
     onChangeText={v=>setData(old=>({...old,week:{...old.week,[day]:v}}))}
     placeholder={`${DAYS[day]} günü için planını yaz…`}
     placeholderTextColor="#858A86"
     multiline
     style={[s.trhLightInput,{minHeight:68,textAlignVertical:'top'}]}
    />
   </View>
  </View>

  <Text style={s.trhFooter}>TOZRA · CREATIVE INTELLIGENCE</Text>
 </ScrollView>;
}

function TaskRow({task,onToggle,onDelete}) { return <View style={s.taskRow}><Pressable onPress={onToggle} style={[s.check,task.done&&s.checkDone]}>{task.done?<Ionicons name="checkmark" color="#171512" size={13}/>:null}</Pressable><View style={{flex:1}}><Text style={[s.taskText,task.done&&{textDecorationLine:'line-through',color:C.faint}]}>{task.title}</Text>{task.date?<Text style={s.smallMuted}>{prettyDate(task.date)} · {task.priority==='high'?'Öncelikli':'Normal'}</Text>:null}</View><Pressable onPress={onDelete}><Ionicons name="close" color={C.faint} size={18}/></Pressable></View>; }

function ChatScreen({session,data,setData,initialPrompt,setInitialPrompt,projectContext}) {
 const [messages,setMessages]=useState(data.chat||[]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[media,setMedia]=useState([]),[agentMode,setAgentMode]=useState(false),[showHistory,setShowHistory]=useState(false);const scroll=useRef(null);const audioRecorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);
 useEffect(()=>{setMessages(data.chat||[]);},[]);
 useEffect(()=>{if(!messages.length){setData(v=>({...v,chat:messages}));return;}setData(v=>{const id=v.currentChatId||uid();const item={id,title:messages.find(m=>m.role==='user')?.content?.slice(0,35)||'Yeni sohbet',messages};const sessions=[item,...(v.chatSessions||[]).filter(x=>x.id!==id)].slice(0,40);return {...v,chat:messages,currentChatId:id,chatSessions:sessions};});},[messages]);
 useEffect(()=>{if(initialPrompt){setInput(initialPrompt);setInitialPrompt('');}},[initialPrompt]);
 async function attach(kind,camera=false){try{let asset;if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error('Kamera izni gerekli.');const result=await ImagePicker.launchCameraAsync({mediaTypes:kind==='video'?['videos']:['images'],quality:.75,base64:kind==='image',videoMaxDuration:60});asset=result.canceled?null:result.assets?.[0];}else asset=await chooseMedia(kind);if(!asset)return;const payload=await mediaPayload(asset,kind);setMedia(v=>[...v,payload].slice(0,15));}catch(e){Alert.alert('Medya eklenemedi',e.message);}}
 async function send(textOverride){const prompt=(textOverride??input).trim();if((!prompt&&!media.length)||busy)return;if(!prompt&&media.length){setError('Dosyaları incelemem için ne yapmamı istediğini de yaz.');return;}const user={id:uid(),role:'user',content:prompt,media:media.map(x=>({kind:x.kind,name:x.name,uri:x.uri}))};const next=[...messages,user];setMessages(next);setInput('');setBusy(true);setError('');try{const imgs=media.filter(x=>x.kind==='image').map(x=>x.data);const frames=media.filter(x=>x.kind==='video').flatMap(x=>x.frames).slice(0,Math.max(0,15-imgs.length));const timeline=media.filter(x=>x.kind==='video').map(x=>`Video: ${x.name}. Üç kronolojik kareyi incele; videonun tamamını veya sesini analiz ettiğini iddia etme.`).join('\n');const result=await apiChat(session,{prompt:prompt+(timeline?`\n\n${timeline}`:''),history:messages.slice(-12).map(m=>({role:m.role,content:m.content})),images:imgs,videoFrames:frames,projectContext:projectContext||'',personalMemory:data.memories.slice(-12).map(content=>({content,category:'Kullanıcı hafızası'})),agentMode});setMessages(v=>[...v,{id:uid(),role:'assistant',content:result.answer,sources:result.sources||[]}]);setMedia([]);}catch(e){setError(e.message||'Bağlantı kurulamadı.');}finally{setBusy(false);}}
 async function voice(){try{const p=await AudioModule.requestRecordingPermissionsAsync();if(!p.granted)throw new Error('Mikrofon izni gerekli.');await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});await audioRecorder.prepareToRecordAsync();audioRecorder.record();Alert.alert('Ses kaydı','Kaydı bitirmek için Tamam’a dokun.',[{text:'İptal',style:'cancel',onPress:async()=>{try{await audioRecorder.stop();}catch{}}},{text:'Tamam',onPress:async()=>{try{await audioRecorder.stop();const uri=audioRecorder.uri;if(!uri)throw new Error('Ses kaydı bulunamadı.');const b64=await FileSystem.readAsStringAsync(uri,{encoding:FileSystem.EncodingType.Base64});const r=await fetch(`${API_BASE_URL}/api/transcribe`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({audio:b64,mimeType:'audio/mp4'})});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Ses çözümlenemedi.');setInput(v=>`${v}${v?' ':''}${d.text}`);}catch(e){Alert.alert('Ses işlenemedi',e.message);}}}]);}catch(e){Alert.alert('Sesli giriş',e.message);}}
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={s.screen}><View style={s.screenHeader}><View><Text style={s.eyebrow}>TOZRA ASİSTAN</Text><Text style={s.screenTitle}>Sohbet</Text></View><View style={{flexDirection:'row',gap:16}}><Pressable onPress={()=>setShowHistory(v=>!v)}><Ionicons name="time-outline" color={C.muted} size={20}/></Pressable><Pressable onPress={()=>Alert.alert('Yeni sohbet','Mevcut sohbet geçmişte saklanacak. Yeni sohbet başlatılsın mı?',[{text:'Vazgeç',style:'cancel'},{text:'Yeni sohbet',onPress:()=>{setData(v=>({...v,currentChatId:uid()}));setMessages([]);setShowHistory(false);}}])}><Ionicons name="add-circle-outline" color={C.muted} size={20}/></Pressable></View></View>{showHistory?<Card style={{marginTop:10,marginBottom:6}}><Text style={s.cardTitle}>Sohbet geçmişi</Text>{(data.chatSessions||[]).filter(x=>x.id!==data.currentChatId).slice(0,8).map(x=><Pressable key={x.id} onPress={()=>{setData(v=>({...v,currentChatId:x.id}));setMessages(x.messages||[]);setShowHistory(false);}} style={s.historyRow}><Text numberOfLines={1} style={{color:C.text,fontSize:11,flex:1}}>{x.title||'Sohbet'}</Text><Ionicons name="chevron-forward" color={C.faint}/></Pressable>)}{!(data.chatSessions||[]).some(x=>x.id!==data.currentChatId)?<Text style={s.smallMuted}>Önceki sohbet bulunmuyor.</Text>:null}</Card>:null}<ScrollView ref={scroll} onContentSizeChange={()=>scroll.current?.scrollToEnd({animated:true})} contentContainerStyle={s.messageList} keyboardShouldPersistTaps="handled">{messages.length===0?<View style={s.chatWelcome}><View style={s.chatSpark}><Ionicons name="sparkles" color={C.accent} size={26}/></View><Text style={s.cardTitle}>Nasıl yardımcı olabilirim?</Text><Text style={s.muted}>Bir fikir, soru, görsel veya proje ile başlayabilirsin.</Text>{['Bana haftalık bir plan hazırla','Yeni bir marka fikri geliştir','Bu konuyu araştır ve kaynaklandır'].map(x=><Pressable key={x} onPress={()=>setInput(x)} style={s.suggestion}><Text style={s.suggestionText}>{x}</Text><Ionicons name="arrow-up" color={C.accent}/></Pressable>)}</View>:messages.map(m=><View key={m.id} style={[s.bubble,m.role==='user'?s.userBubble:s.aiBubble]}><Text style={s.messageRole}>{m.role==='user'?'SEN':'TOZRA'}</Text><Text style={s.messageText}>{m.content}</Text>{m.media?.length?<Text style={s.smallMuted}>{m.media.length} medya eklendi</Text>:null}{m.sources?.length?<Text style={s.smallMuted}>{m.sources.length} kaynak</Text>:null}</View>)}{busy?<View style={[s.bubble,s.aiBubble, s.busyRow]}><ActivityIndicator color={C.accent}/><Text style={s.messageText}>TOZRA düşünüyor…</Text></View>:null}</ScrollView>{media.length>0?<ScrollView horizontal style={{maxHeight:55}}>{media.map((m,i)=><View key={i} style={s.mediaChip}><Ionicons name={m.kind==='video'?'videocam':'image'} color={C.accent}/><Text style={s.smallMuted}>{m.name.slice(0,17)}</Text><Pressable onPress={()=>setMedia(v=>v.filter((_,j)=>j!==i))}><Ionicons name="close" color={C.faint}/></Pressable></View>)}</ScrollView>:null}{error?<Text style={s.error}>{error}</Text>:null}<View style={s.composer}><View style={s.attachRow}><Pressable onPress={()=>attach('image')}><Ionicons name="image-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>attach('image',true)}><Ionicons name="camera-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>attach('video')}><Ionicons name="videocam-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>attach('video',true)}><Ionicons name="radio-button-on-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={voice}><Ionicons name="mic-outline" color={C.muted} size={19}/></Pressable><Pressable onPress={()=>setAgentMode(v=>!v)} style={{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:4}}><Ionicons name="flash-outline" color={agentMode?C.accent:C.muted} size={16}/><Text style={{color:agentMode?C.accent:C.faint,fontSize:9,fontWeight:'800'}}>AGENT {agentMode?'AÇIK':'KAPALI'}</Text></Pressable></View><TextInput value={input} onChangeText={setInput} placeholder="Mesajını yaz…" placeholderTextColor={C.faint} multiline style={s.composerInput}/><Pressable onPress={()=>send()} disabled={busy||(!input.trim()&&!media.length)} style={[s.sendButton,(busy||(!input.trim()&&!media.length))&&{opacity:.4}]}><Ionicons name="arrow-up" size={20} color="#171512"/></Pressable></View><Text style={s.disclaimer}>Görsel ve video analizinde videodan en fazla üç kare örneklenir.</Text></View></KeyboardAvoidingView>;
}

function ProjectsScreen({data,setData,session,onOpenChat}) {
 const [editing,setEditing]=useState(false),[name,setName]=useState(''),[category,setCategory]=useState('Fikir geliştirme'),[description,setDescription]=useState(''),[selected,setSelected]=useState(null),[goal,setGoal]=useState(''),[milestone,setMilestone]=useState(''),[task,setTask]=useState('');
 function create(){if(!name.trim())return;const p={id:uid(),name:name.trim(),category,description:description.trim(),createdAt:Date.now(),updatedAt:Date.now(),studio:{goal:'',milestones:[],tasks:[]},notes:''};setData(v=>({...v,projects:[p,...v.projects]}));setName('');setDescription('');setEditing(false);setSelected(p.id);}
 const project=data.projects.find(p=>p.id===selected);
 function update(fn){setData(v=>({...v,projects:v.projects.map(p=>{if(p.id!==selected)return p;const base={...p,studio:{goal:'',milestones:[],tasks:[],...(p.studio||{})}};return {...fn(base),updatedAt:Date.now()};})}));}
 if(project){const studio=project.studio||{goal:'',milestones:[],tasks:[]};return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Pressable onPress={()=>setSelected(null)} style={s.back}><Ionicons name="chevron-back" color={C.accent}/> <Text style={s.accentText}>Tüm projeler</Text></Pressable><View style={s.projectHero}><Text style={s.eyebrow}>{project.category.toUpperCase()}</Text><Text style={s.screenTitle}>{project.name}</Text><Text style={s.muted}>{project.description||'Bu proje için henüz açıklama eklenmedi.'}</Text></View><Heading title="Proje hedefi"/><Card><Field value={studio.goal||''} onChangeText={v=>update(p=>({...p,studio:{...p.studio,goal:v}}))} placeholder="Bu projeyle ulaşmak istediğin sonuç…" multiline style={{minHeight:75,textAlignVertical:'top'}}/></Card><Heading title="Kilometre taşları" hint="PROJE İLERLEMESİ"/><Card><View style={s.addRow}><Field value={milestone} onChangeText={setMilestone} placeholder="Yeni aşama ekle…" style={{flex:1}}/><Pressable style={s.addButton} onPress={()=>{if(milestone.trim()){update(p=>({...p,studio:{...p.studio,milestones:[...(p.studio?.milestones||[]),{id:uid(),title:milestone,done:false}]}}));setMilestone('');}}}><Ionicons name="add" size={22} color="#171512"/></Pressable></View>{(studio.milestones||[]).map(m=><TaskRow key={m.id} task={m} onToggle={()=>update(p=>({...p,studio:{...p.studio,milestones:p.studio.milestones.map(x=>x.id===m.id?{...x,done:!x.done}:x)}}))} onDelete={()=>update(p=>({...p,studio:{...p.studio,milestones:p.studio.milestones.filter(x=>x.id!==m.id)}}))}/>)}</Card><Heading title="Proje görevleri"/><Card><View style={s.addRow}><Field value={task} onChangeText={setTask} placeholder="Proje görevi ekle…" style={{flex:1}}/><Pressable style={s.addButton} onPress={()=>{if(task.trim()){update(p=>({...p,studio:{...p.studio,tasks:[...(p.studio?.tasks||[]),{id:uid(),title:task,done:false}]}}));setTask('');}}}><Ionicons name="add" size={22} color="#171512"/></Pressable></View>{(studio.tasks||[]).map(t=><TaskRow key={t.id} task={t} onToggle={()=>update(p=>({...p,studio:{...p.studio,tasks:p.studio.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}}))} onDelete={()=>update(p=>({...p,studio:{...p.studio,tasks:p.studio.tasks.filter(x=>x.id!==t.id)}}))}/>)}</Card><Heading title="Proje notları"/><Card><Field value={project.notes||''} onChangeText={v=>update(p=>({...p,notes:v}))} placeholder="Proje notları…" multiline style={{minHeight:110,textAlignVertical:'top'}}/></Card><Button title="Bu projede TOZRA ile çalış" icon="sparkles" onPress={()=>onOpenChat(`Proje: ${project.name}\nKategori: ${project.category}\nAçıklama: ${project.description}\nHedef: ${studio.goal||'Belirtilmedi'}\nNotlar: ${project.notes||''}\nBu proje üzerinde birlikte çalışalım.`)}/><Button title="Projeyi sil" secondary icon="trash-outline" onPress={()=>Alert.alert('Projeyi sil','Bu proje kalıcı olarak silinsin mi?',[{text:'Vazgeç',style:'cancel'},{text:'Sil',style:'destructive',onPress:()=>{setData(v=>({...v,projects:v.projects.filter(p=>p.id!==selected)}));setSelected(null);}}])}/></ScrollView>;}
 return <ScrollView contentContainerStyle={s.page}><View style={s.screenHeader}><View><Text style={s.eyebrow}>ÜRETİM ALANIN</Text><Text style={s.screenTitle}>Projeler</Text></View><Pressable style={s.addButton} onPress={()=>setEditing(v=>!v)}><Ionicons name={editing?'close':'add'} color="#171512" size={23}/></Pressable></View>{editing?<Card><Text style={s.cardTitle}>Yeni proje</Text><Field value={name} onChangeText={setName} placeholder="Proje adı"/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,marginBottom:12}}>{['Fikir geliştirme','İçerik üretimi','Görsel stüdyo','Video stüdyo','Araştırma'].map(x=><Chip key={x} label={x} active={category===x} onPress={()=>setCategory(x)}/>)}</ScrollView><Field value={description} onChangeText={setDescription} placeholder="Kısa açıklama" multiline/><Button title="Projeyi oluştur" onPress={create}/></Card>:null}{data.projects.length===0?<Card><Text style={s.empty}>Henüz proje yok. İlk projenin çalışma alanını oluştur.</Text></Card>:data.projects.map(p=><Pressable key={p.id} onPress={()=>setSelected(p.id)} style={s.projectCard}><View style={s.projectIcon}><Ionicons name="folder-open-outline" color={C.accent} size={21}/></View><View style={{flex:1}}><Text style={s.cardTitle}>{p.name}</Text><Text style={s.smallMuted}>{p.category} · {p.description||'Açıklama eklenmedi'}</Text><Text style={s.smallMuted}>{(p.studio?.milestones||[]).filter(x=>x.done).length}/{(p.studio?.milestones||[]).length} aşama tamamlandı</Text></View><Ionicons name="chevron-forward" color={C.faint}/></Pressable>)}</ScrollView>;
}

function StudioScreen({session,data,setData,onOpenChat}) {
 const [mode,setMode]=useState('idea'),[brief,setBrief]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState(''),[image,setImage]=useState(''),[error,setError]=useState('');
 async function run(){if(!brief.trim())return;setBusy(true);setError('');setResult('');setImage('');try{if(mode==='image'){const r=await fetch(`${API_BASE_URL}/api/generate-image`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({prompt:`Professional creative visual for TOZRA user. ${brief.trim()}`})});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Görsel üretilemedi.');setImage(d.image);}else{const cfg=MODES[mode];const r=await apiChat(session,{prompt:`CREATIVE STUDIO / ${cfg.title}\n${cfg.instruction}\n\nKullanıcı brief'i: ${brief.trim()}`,history:[],personalMemory:data.memories.slice(-8).map(content=>({content,category:'Tercih'}))});setResult(r.answer);}}catch(e){setError(e.message||'İşlem tamamlanamadı.');}finally{setBusy(false);}}
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>YARATICI ÜRETİM ALANI</Text><Text style={s.screenTitle}>Creative Studio</Text><Text style={s.muted}>Fikirden yaratıcı brief'e, görsel konseptten kampanya planına.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.modeRow}>{Object.entries(MODES).map(([key,m])=><Pressable key={key} onPress={()=>setMode(key)} style={[s.modeCard,mode===key&&s.modeCardActive]}><Ionicons name={m.icon} size={20} color={mode===key?C.accent:C.muted}/><Text style={[s.modeText,mode===key&&{color:C.text}]}>{m.title}</Text></Pressable>)}</ScrollView><Card><Text style={s.cardTitle}>{MODES[mode].title}</Text><Field value={brief} onChangeText={setBrief} placeholder="Ne üretmek veya geliştirmek istiyorsun? Hedefini, tarzını ve detayları yaz…" multiline style={{minHeight:140,textAlignVertical:'top'}}/><Button title={busy?'Hazırlanıyor…':mode==='image'?'Görsel oluştur':'Studio çalışmasını başlat'} onPress={run} disabled={busy||!brief.trim()} icon={mode==='image'?'image-outline':'sparkles'}/>{busy?<ActivityIndicator color={C.accent} style={{marginTop:12}}/>:null}{error?<Text style={s.error}>{error}</Text>:null}</Card>{image?<Card><Text style={s.cardTitle}>Üretilen görsel</Text><Image source={{uri:image}} style={{width:'100%',height:300,borderRadius:14}} resizeMode="contain"/><Button title="Görseli incele / geliştir" secondary onPress={()=>onOpenChat(`Creative Studio görsel brief'i: ${brief}\nBu görsel konseptini değerlendir ve geliştirme önerileri sun.`)}/></Card>:null}{result?<Card><Text style={s.cardTitle}>Studio çıktısı</Text><Text style={s.messageText}>{result}</Text><Button title="Projede devam et" onPress={()=>onOpenChat(`Creative Studio çıktısı:\n${result}\n\nBunu daha ileri geliştirelim.`)}/></Card>:null}<Text style={s.smallMuted}>Not: Video stüdyosu senaryo ve storyboard hazırlar; bu sürümde doğrudan video render işlemi yapılmaz.</Text></ScrollView>;
}

function TasksScreen({data,setData}) {
 const [selected,setSelected]=useState(dateKey()),[month,setMonth]=useState(new Date()),[taskTitle,setTaskTitle]=useState(''),[eventTitle,setEventTitle]=useState(''),[eventTime,setEventTime]=useState(''),[taskOpen,setTaskOpen]=useState(false),[eventOpen,setEventOpen]=useState(false),[priority,setPriority]=useState('normal');
 const year=month.getFullYear(),mon=month.getMonth(),days=new Date(year,mon+1,0).getDate(),offset=(new Date(year,mon,1).getDay()+6)%7;const cells=Array.from({length:42},(_,i)=>{const n=i-offset+1;const d=new Date(year,mon,n);return {key:dateKey(d),day:d.getDate(),muted:n<1||n>days};});const todayTasks=data.tasks.filter(t=>t.date===selected),events=data.events.filter(e=>e.date===selected);
 function addTask(){if(!taskTitle.trim())return;setData(v=>({...v,tasks:[...v.tasks,{id:uid(),title:taskTitle.trim(),date:selected,priority,done:false}]}));setTaskTitle('');setTaskOpen(false);}
 function addEvent(){if(!eventTitle.trim())return;setData(v=>({...v,events:[...v.events,{id:uid(),title:eventTitle.trim(),date:selected,time:eventTime,note:''}]}));setEventTitle('');setEventTime('');setEventOpen(false);}
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>PLANLAMA ALANI</Text><Text style={s.screenTitle}>Görevler & Takvim</Text><View style={s.monthHeader}><Pressable onPress={()=>setMonth(new Date(year,mon-1,1))}><Ionicons name="chevron-back" color={C.text} size={21}/></Pressable><Text style={s.cardTitle}>{month.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</Text><Pressable onPress={()=>setMonth(new Date(year,mon+1,1))}><Ionicons name="chevron-forward" color={C.text} size={21}/></Pressable></View><Card><View style={s.calendarGrid}>{['P','S','Ç','P','C','C','P'].map((x,i)=><Text key={`h${i}`} style={s.calendarWeek}>{x}</Text>)}{cells.map(c=>{const has=data.tasks.some(t=>t.date===c.key&&!t.done)||data.events.some(e=>e.date===c.key);return <Pressable key={c.key} onPress={()=>setSelected(c.key)} style={[s.calendarDay,selected===c.key&&s.calendarDayActive,c.muted&&{opacity:.35}]}><Text style={[s.calendarDayText,selected===c.key&&{color:'#171512'}]}>{c.day}</Text>{has?<View style={[s.calendarDot,selected===c.key&&{backgroundColor:'#171512'}]}/>:null}</Pressable>;})}</View></Card><View style={s.selectedDateRow}><Text style={s.cardTitle}>{prettyDate(selected)}</Text><View style={{flexDirection:'row',gap:8}}><Pressable onPress={()=>setTaskOpen(v=>!v)} style={s.smallAction}><Ionicons name="add" color={C.accent}/><Text style={s.accentText}>Görev</Text></Pressable><Pressable onPress={()=>setEventOpen(v=>!v)} style={s.smallAction}><Ionicons name="calendar" color={C.accent}/><Text style={s.accentText}>Etkinlik</Text></Pressable></View></View>{taskOpen?<Card><Field value={taskTitle} onChangeText={setTaskTitle} placeholder="Görev adı"/><View style={{flexDirection:'row',gap:7,marginBottom:12}}><Chip label="Normal" active={priority==='normal'} onPress={()=>setPriority('normal')}/><Chip label="Öncelikli" active={priority==='high'} onPress={()=>setPriority('high')}/></View><Button title="Görevi kaydet" onPress={addTask}/></Card>:null}{eventOpen?<Card><Field value={eventTitle} onChangeText={setEventTitle} placeholder="Etkinlik adı"/><Field value={eventTime} onChangeText={setEventTime} placeholder="Saat (örn. 14:30)"/><Button title="Etkinliği kaydet" onPress={addEvent}/></Card>:null}<Heading title="Günün planı" hint={`${todayTasks.length+events.length} KAYIT`}/><Card>{events.map(e=><View key={e.id} style={s.taskRow}><Ionicons name="calendar-outline" color={C.accent}/><View style={{flex:1}}><Text style={s.taskText}>{e.title}</Text><Text style={s.smallMuted}>{e.time||'Saat belirtilmedi'} · Etkinlik</Text></View><Pressable onPress={()=>setData(v=>({...v,events:v.events.filter(x=>x.id!==e.id)}))}><Ionicons name="close" color={C.faint}/></Pressable></View>)}{todayTasks.map(t=><TaskRow key={t.id} task={t} onToggle={()=>setData(v=>({...v,tasks:v.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}))} onDelete={()=>setData(v=>({...v,tasks:v.tasks.filter(x=>x.id!==t.id)}))}/>)}{!todayTasks.length&&!events.length?<Text style={s.empty}>Bu gün için plan bulunmuyor.</Text>:null}</Card></ScrollView>;
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

function ProfileScreen({user,onSignOut,data,setData}) { const [memory,setMemory]=useState('');return <ScrollView contentContainerStyle={s.page}><View style={s.profileHero}><View style={s.avatar}><Ionicons name="person" color={C.accent} size={30}/></View><Text style={s.screenTitle}>{user?.user_metadata?.full_name||'TOZRA kullanıcısı'}</Text><Text style={s.muted}>{user?.email}</Text></View><Heading title="Kişisel hafıza" hint="TOZRA BAĞLAMI"/><Card><Text style={s.muted}>TOZRA'nın yanıtlarında kullanmak istediğin tercih veya proje bağlamlarını sakla.</Text><Field value={memory} onChangeText={setMemory} placeholder="Hatırlanmasını istediğin not…" multiline/><Button title="Hafızaya ekle" onPress={()=>{const value=memory.trim();if(!value)return;if(/api[_ -]?key|password|şifre|parola|secret|token|kimlik numarası|kart numarası|açık adres|telefon numaram|hastalık|teşhis|ilaç|sağlık durumum|siyasi görüş|dinim|ırkım/i.test(value)){Alert.alert('Bu bilgi kaydedilemez','Şifre, kimlik, adres ve hassas kişisel bilgileri hafızaya ekleme.');return;}setData(v=>({...v,memories:[...v.memories,value]}));setMemory('');}}/>{data.memories.map((m,i)=><View key={i} style={s.memoryRow}><Text style={[s.taskText,{flex:1}]}>{m}</Text><Pressable onPress={()=>setData(v=>({...v,memories:v.memories.filter((_,j)=>j!==i)}))}><Ionicons name="close" color={C.faint}/></Pressable></View>)}</Card><Heading title="Hesap"/><Card><Text style={s.muted}>Güvenli oturum · Supabase Auth</Text><Text style={s.muted}>Native uygulama · Android ve iOS</Text><Text style={s.muted}>TOZRA modülleri · 7 çalışma alanı</Text></Card><Button title="Çıkış yap" secondary icon="log-out-outline" onPress={()=>Alert.alert('Çıkış yapılsın mı?','TOZRA hesabından çıkış yapacaksın.',[{text:'Vazgeç',style:'cancel'},{text:'Çıkış yap',style:'destructive',onPress:onSignOut}])}/><Text style={s.foot}>TOZRA · Creative Intelligence</Text></ScrollView>; }

function MainApp({session}) {
 const [tab,setTab]=useState('home'),[data,setData]=useState({tasks:[],notes:'',week:{},chat:[],projects:[],events:[],memories:[],workspace:{atlas:[],nexus:[],universe:[],marketFavorites:[],marketInstalled:[],social:[]}}),[ready,setReady]=useState(false),[initialPrompt,setInitialPrompt]=useState(''),[projectContext,setProjectContext]=useState('');
 const cloudDataRef=useRef({});
 const screenIn=useRef(new Animated.Value(1)).current;
 const screenShift=useRef(new Animated.Value(0)).current;
 useEffect(()=>{screenIn.setValue(0);screenShift.setValue(12);Animated.parallel([
  Animated.timing(screenIn,{toValue:1,duration:260,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
  Animated.timing(screenShift,{toValue:0,duration:300,easing:Easing.out(Easing.cubic),useNativeDriver:true})
 ]).start();},[tab]);
 useEffect(()=>{let active=true;(async()=>{try{
   const entries=await Promise.all(Object.entries(STORE).map(async([k,v])=>[k,await AsyncStorage.getItem(scopedKey(session.user.id,v))]));
   if(!active)return;
   const next={tasks:[],notes:'',week:{},chat:[],chatSessions:[],currentChatId:null,projects:[],events:[],memories:[],workspace:{atlas:[],nexus:[],universe:[],marketFavorites:[],marketInstalled:[],social:[]}};
   for(const [k,v] of entries)if(v!==null){try{const parsed=JSON.parse(v);if(k==='calendar')next.events=parsed.events||[];else if(k==='workspace')next.workspace={...next.workspace,...parsed};else next[k]=parsed;}catch{}}
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
     const mobileWorkspace=cloud['tozra-mobile-workspace-v1'];if(mobileWorkspace&&typeof mobileWorkspace==='object')next.workspace={...next.workspace,...mobileWorkspace};
   }
   setData(next);
   if(!row){const payload={...cloudDataRef.current,'tozra-projects':next.projects,ircal_tasks_calendar_v1:{tasks:next.tasks,events:next.events},'tozra-web-home-notes-v1':next.notes,'tozra-web-home-week-v1':next.week,'tozra-conversations':next.chatSessions.length?next.chatSessions:(next.chat.length?[{id:next.chat[0]?.id||Date.now(),title:next.chat.find(m=>m.role==='user')?.content?.slice(0,35)||'Yeni sohbet',messages:next.chat}]:[]),'tozra-personal-memory-v1':next.memories.map((content,i)=>({id:`mobile-${i}`,content,category:'genel',createdAt:Date.now()})),'tozra-mobile-workspace-v1':next.workspace};
     const {error:upsertError}=await sb.from('user_data').upsert({user_id:session.user.id,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(upsertError)throw upsertError;cloudDataRef.current=payload;
   }
  }catch(e){console.warn('TOZRA cloud sync unavailable; local storage remains active:',e.message);}finally{if(active)setReady(true);}})();return()=>{active=false;};},[session.user.id]);
 useEffect(()=>{if(!ready)return;const writes=[['tasks',data.tasks],['notes',data.notes],['week',data.week],['chat',data.chat],['projects',data.projects],['calendar',{tasks:data.tasks,events:data.events}],['memories',data.memories],['workspace',data.workspace||{}]];writes.forEach(([k,v])=>AsyncStorage.setItem(scopedKey(session.user.id,STORE[k]),JSON.stringify(v)).catch(e=>console.warn('TOZRA save failed',k,e)));
   const timer=setTimeout(async()=>{try{const payload={...cloudDataRef.current,'tozra-projects':data.projects,ircal_tasks_calendar_v1:{tasks:data.tasks,events:data.events},'tozra-web-home-tasks-v1':data.tasks,'tozra-web-home-notes-v1':data.notes,'tozra-web-home-week-v1':data.week,'tozra-conversations':data.chatSessions.length?data.chatSessions:(data.chat.length?[{id:data.chat[0]?.id||Date.now(),title:data.chat.find(m=>m.role==='user')?.content?.slice(0,35)||'Yeni sohbet',messages:data.chat}]:[]),'tozra-personal-memory-v1':data.memories.map((content,i)=>({id:`mobile-${i}`,content,category:'genel',createdAt:Date.now()})),'tozra-mobile-workspace-v1':data.workspace||{}};const {error}=await getSupabase().from('user_data').upsert({user_id:session.user.id,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;cloudDataRef.current=payload;}catch(e){console.warn('TOZRA cloud save failed:',e.message);}},900);
   return()=>clearTimeout(timer);
 },[data,ready,session.user.id]);
 function openChat(prompt,context=''){setInitialPrompt(prompt||'');setProjectContext(context);setTab('chat');}
 async function signOut(){await getSupabase().auth.signOut();}
 let activeScreen;
 if(tab==='home') activeScreen=<HomeScreen data={data} setData={setData} onTab={setTab} onOpenChat={p=>openChat(p)} session={session}/>;
 else if(tab==='chat') activeScreen=<ChatScreen session={session} data={data} setData={setData} initialPrompt={initialPrompt} setInitialPrompt={setInitialPrompt} projectContext={projectContext}/>;
 else if(tab==='projects') activeScreen=<ProjectsScreen data={data} setData={setData} session={session} onOpenChat={p=>openChat(p)}/>;
 else if(tab==='studio') activeScreen=<StudioScreen session={session} data={data} setData={setData} onOpenChat={p=>openChat(p)}/>;
 else if(tab==='tasks') activeScreen=<TasksScreen data={data} setData={setData}/>;
 else if(tab==='web') activeScreen=<TozraWebScreen onOpenChat={p=>openChat(p,'TOZRA Web sitesi oluşturma briefi. Kullanıcıya site mimarisi, tasarım sistemi ve tek dosyalık HTML/CSS/JS çıktısı hazırla; çalıştırılabilir olduğunu iddia etmeden kodu açıkça ver.')}/>;
 else if(['atlas','nexus','universe','market','social'].includes(tab)) activeScreen=<WorkspaceModules tab={tab} data={data} setData={setData} onCreateProject={p=>setData(v=>({...v,projects:[p,...v.projects]}))}/>;
 else activeScreen=<ProfileScreen user={session.user} onSignOut={signOut} data={data} setData={setData}/>;
 if(!ready)return <View style={s.loading}><Brand/><ActivityIndicator color={C.accent} style={{marginTop:20}}/></View>;
 return <SafeAreaView style={[s.safe,tab==='home'&&{backgroundColor:'#F4F5F4'}]} edges={['top']}><View style={[s.topBar,tab==='home'&&s.trhTopBar]}><View style={s.brandRow}><View style={[s.brandMark,{width:34,height:34,borderRadius:11},tab==='home'&&{backgroundColor:'#171A18',borderColor:'#2C7137'}]}><Text style={[s.brandLetter,{fontSize:20},tab==='home'&&{color:'#A6DC54'}]}>T</Text></View><View><Text style={[s.brandName,{fontSize:18},tab==='home'&&{color:'#171A18'}]}>TOZRA</Text><Text style={[s.brandSub,tab==='home'&&{color:'#6D716E'}]}>CREATIVE INTELLIGENCE</Text></View></View><Pressable onPress={()=>setTab('profile')} style={[s.avatarMini,tab==='home'&&{backgroundColor:'rgba(255,255,255,0.75)',borderWidth:1,borderColor:'#E2E6E3'}]}><Ionicons name="person-outline" color={tab==='home'?'#171A18':C.text} size={17}/></Pressable></View><Animated.View style={{flex:1,opacity:screenIn,transform:[{translateY:screenShift}]}}>{activeScreen}</Animated.View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.tabScroll,tab==='home'&&s.trhTabScroll]} contentContainerStyle={s.tabBar}>{TABS.map(t=><Pressable key={t[0]} onPress={()=>setTab(t[0])} style={[s.tabItem,tab==='home'&&s.trhTabItem,tab===t[0]&&(tab==='home'?s.trhTabItemActive:s.tabItemActive)]}><Ionicons name={tab===t[0]?t[3]:t[2]} size={19} color={tab===t[0]?(tab==='home'?'#172119':C.accent):(tab==='home'?'#626966':C.faint)}/><Text style={[s.tabLabel,tab==='home'&&{color:'#626966'},tab===t[0]&&{color:tab==='home'?'#172119':C.accent}]}>{t[1]}</Text></Pressable>)}</ScrollView></SafeAreaView>;
}

export default function App(){const [introDone,setIntroDone]=useState(false),[clientReady,setClientReady]=useState(false),[bootError,setBootError]=useState(''),[session,setSession]=useState(null),[authChecked,setAuthChecked]=useState(false);useEffect(()=>{let sub,mounted=true;(async()=>{try{const sb=await initializeSupabase();const {data}=await sb.auth.getSession();if(!mounted)return;setSession(data.session);const r=sb.auth.onAuthStateChange((_e,next)=>{if(mounted)setSession(next);});sub=r.data.subscription;setClientReady(true);}catch(e){if(mounted)setBootError(e.message||'Başlatma hatası');}finally{if(mounted)setAuthChecked(true);}})();return()=>{mounted=false;sub?.unsubscribe();};},[]);return <SafeAreaProvider>{!introDone?<IntroSplash onFinish={()=>setIntroDone(true)}/>:<><StatusBar barStyle="light-content" backgroundColor={C.bg}/><ExpoStatusBar style="light"/>{!authChecked?<View style={s.loading}><Brand/><ActivityIndicator color={C.accent} style={{marginTop:20}}/><Text style={s.muted}>TOZRA hazırlanıyor…</Text></View>:bootError?<SafeAreaView style={s.safe}><View style={s.errorScreen}><Brand/><Text style={s.authTitle}>Bağlantı kurulamadı</Text><Text style={s.muted}>{bootError}</Text><Button title="Yeniden dene" onPress={()=>{setAuthChecked(false);setBootError('');initializeSupabase().then(async()=>{const {data}=await getSupabase().auth.getSession();setSession(data.session);setClientReady(true);setAuthChecked(true);}).catch(e=>{setBootError(e.message);setAuthChecked(true);});}}/></View></SafeAreaView>:session?<MainApp session={session}/>:clientReady?<AuthScreen onReady={setSession}/>:<AuthScreen onReady={setSession}/>}</>}</SafeAreaProvider>;}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'},authWrap:{flexGrow:1,justifyContent:'center',padding:24,paddingTop:40,paddingBottom:40},brandRow:{flexDirection:'row',alignItems:'center',gap:10},brandMark:{width:42,height:42,borderRadius:14,backgroundColor:'#29251F',borderWidth:1,borderColor:'#8D785B',alignItems:'center',justifyContent:'center'},brandLetter:{color:'#D6C5A1',fontSize:25,fontWeight:'900'},brandName:{color:C.text,fontSize:21,fontWeight:'900',letterSpacing:2},brandSub:{color:C.faint,fontSize:7,letterSpacing:2,marginTop:2},eyebrow:{color:C.accent,fontSize:9,fontWeight:'900',letterSpacing:1.5},authTitle:{color:C.text,fontSize:31,fontWeight:'850',marginTop:12,marginBottom:9},muted:{color:C.muted,fontSize:12,lineHeight:19,marginTop:7},foot:{color:C.faint,textAlign:'center',fontSize:9,marginTop:22},card:{backgroundColor:C.surface,borderColor:C.line,borderWidth:1,borderRadius:18,padding:15,marginBottom:16},cardTitle:{color:C.text,fontWeight:'800',fontSize:15,marginBottom:10},field:{backgroundColor:C.surface2,borderWidth:1,borderColor:C.line,borderRadius:12,color:C.text,minHeight:47,paddingHorizontal:13,paddingVertical:11,fontSize:12,marginBottom:10},button:{backgroundColor:C.accent,minHeight:47,borderRadius:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,paddingHorizontal:15,marginTop:5},buttonSecondary:{backgroundColor:C.surface2,borderWidth:1,borderColor:C.line},buttonText:{color:'#171512',fontSize:12,fontWeight:'900'},error:{color:C.danger,fontSize:11,marginVertical:8},safeArea:{flex:1},topBar:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},avatarMini:{width:35,height:35,borderRadius:12,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center'},page:{padding:17,paddingBottom:30},hero:{backgroundColor:'#172016',borderWidth:1,borderColor:'#3C4B2E',borderRadius:21,padding:18,marginBottom:16},heroTitle:{color:C.text,fontSize:29,fontWeight:'900',lineHeight:35,letterSpacing:-.8,marginTop:12,marginBottom:8},askBar:{height:48,borderRadius:12,borderWidth:1,borderColor:'#48583A',backgroundColor:'#10170F',marginTop:17,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:9},askText:{color:C.muted,fontSize:12,flex:1},stats:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:15,padding:14,flexDirection:'row',justifyContent:'space-around',marginBottom:23},stat:{alignItems:'center',flex:1},statNum:{color:C.text,fontSize:21,fontWeight:'850'},statLabel:{color:C.faint,fontSize:8,letterSpacing:.7,marginTop:4,fontWeight:'800'},heading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10,marginTop:5},headingText:{color:C.text,fontSize:16,fontWeight:'800'},hint:{color:C.faint,fontSize:8,letterSpacing:1,fontWeight:'800'},quickGrid:{gap:8,marginBottom:20},quickCard:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:17,padding:15,flexDirection:'row',alignItems:'center',gap:12},quickText:{color:C.text,fontSize:12,fontWeight:'700',flex:1},addRow:{flexDirection:'row',alignItems:'center',gap:8},addButton:{width:46,height:46,borderRadius:12,backgroundColor:C.accent2,alignItems:'center',justifyContent:'center'},empty:{color:C.faint,fontSize:11,textAlign:'center',paddingVertical:14},smallMuted:{color:C.faint,fontSize:9,lineHeight:14,marginTop:4},taskRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11,borderTopWidth:1,borderTopColor:C.line},check:{width:20,height:20,borderRadius:7,borderWidth:1.5,borderColor:C.faint,alignItems:'center',justifyContent:'center'},checkDone:{backgroundColor:C.accent2,borderColor:C.accent2},taskText:{color:C.text,fontSize:12},calendarGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-start'},calendarWeek:{width:'14.285%',textAlign:'center',color:C.faint,fontSize:10,paddingVertical:9},calendarDay:{width:'14.285%',height:42,alignItems:'center',justifyContent:'center',borderRadius:10},calendarDayActive:{backgroundColor:C.accent2},calendarDayText:{color:C.text,fontSize:11,fontWeight:'700'},calendarDot:{width:4,height:4,borderRadius:3,backgroundColor:C.accent,marginTop:2},monthHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14},selectedDateRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:13},smallAction:{flexDirection:'row',alignItems:'center',gap:4,padding:8,backgroundColor:C.surface2,borderRadius:9},accentText:{color:C.accent,fontSize:10,fontWeight:'800'},chip:{paddingHorizontal:11,paddingVertical:8,borderRadius:10,backgroundColor:C.surface2,borderWidth:1,borderColor:C.line},chipActive:{backgroundColor:'#29351F',borderColor:'#647A49'},chipText:{color:C.muted,fontSize:10,fontWeight:'700'},chipTextActive:{color:'#D7E8BC'},screen:{flex:1,paddingHorizontal:15,paddingTop:12,paddingBottom:8},screenHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingBottom:12,borderBottomWidth:1,borderBottomColor:C.line},screenTitle:{color:C.text,fontSize:27,fontWeight:'900',letterSpacing:-.6,marginTop:5,marginBottom:3},messageList:{flexGrow:1,paddingVertical:14,gap:10},chatWelcome:{flex:1,minHeight:300,alignItems:'center',justifyContent:'center',paddingHorizontal:12},chatSpark:{width:54,height:54,borderRadius:18,backgroundColor:'#302A22',alignItems:'center',justifyContent:'center',marginBottom:15},suggestion:{width:'100%',padding:12,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.surface,flexDirection:'row',justifyContent:'space-between',marginTop:8},suggestionText:{color:C.muted,fontSize:11},bubble:{maxWidth:'92%',borderRadius:18,padding:14},userBubble:{alignSelf:'flex-end',backgroundColor:'#39332B',borderBottomRightRadius:4},aiBubble:{alignSelf:'flex-start',backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderBottomLeftRadius:4},messageRole:{color:C.accent,fontSize:8,fontWeight:'900',letterSpacing:1,marginBottom:5},messageText:{color:C.text,fontSize:12,lineHeight:19},busyRow:{flexDirection:'row',alignItems:'center',gap:9},composer:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:19,padding:10},attachRow:{flexDirection:'row',gap:16,paddingHorizontal:7,paddingBottom:5},composerInput:{color:C.text,minHeight:38,maxHeight:100,paddingHorizontal:8,paddingTop:7,fontSize:12},sendButton:{position:'absolute',right:8,bottom:8,width:37,height:37,borderRadius:11,backgroundColor:C.accent2,alignItems:'center',justifyContent:'center'},disclaimer:{color:C.faint,fontSize:8,textAlign:'center',paddingTop:6},mediaChip:{flexDirection:'row',alignItems:'center',gap:7,padding:8,backgroundColor:C.surface2,borderRadius:10,marginRight:8},modeRow:{gap:8,paddingVertical:17},modeCard:{minWidth:125,padding:14,borderRadius:15,borderWidth:1,borderColor:C.line,backgroundColor:C.surface,alignItems:'center',gap:9},modeCardActive:{borderColor:C.accent,backgroundColor:'#29251F'},modeText:{color:C.muted,fontSize:9,fontWeight:'800',textAlign:'center'},projectCard:{flexDirection:'row',alignItems:'center',gap:13,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:18,padding:16,marginBottom:11},projectIcon:{width:42,height:42,borderRadius:12,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center'},projectHero:{paddingVertical:18},back:{flexDirection:'row',alignItems:'center',gap:4,paddingVertical:8},tabScroll:{maxHeight:68,borderTopWidth:1,borderTopColor:C.line,backgroundColor:'#101114'},historyRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:9,borderTopWidth:1,borderTopColor:C.line},tabItem:{minWidth:65,alignItems:'center',justifyContent:'center',gap:4,paddingHorizontal:7,paddingVertical:8},tabItemActive:{backgroundColor:'#29251F',borderRadius:12},tabLabel:{color:C.faint,fontSize:8,fontWeight:'800'},profileHero:{alignItems:'center',paddingVertical:25},avatar:{width:68,height:68,borderRadius:23,backgroundColor:'#302A22',alignItems:'center',justifyContent:'center',marginBottom:12},memoryRow:{flexDirection:'row',alignItems:'center',gap:8,borderTopWidth:1,borderTopColor:C.line,paddingVertical:10},foot:{color:C.faint,textAlign:'center',fontSize:9,marginTop:18},tabBar:{flexDirection:'row',gap:4},
 homeTopline:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:15},
 homeDate:{color:C.muted,fontSize:11,marginTop:5,textTransform:'capitalize'},
 livePill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:7,borderRadius:20,backgroundColor:C.surface2,borderWidth:1,borderColor:C.line},
 liveDot:{width:6,height:6,borderRadius:4,backgroundColor:C.success},
 liveText:{color:C.muted,fontSize:8,fontWeight:'900',letterSpacing:.8},
 hero:{backgroundColor:'#222328',borderWidth:1,borderColor:'#3A3F47',borderRadius:23,padding:19,marginBottom:19,overflow:'hidden'},
 heroOrb:{width:42,height:42,borderRadius:14,backgroundColor:'#3A342B',alignItems:'center',justifyContent:'center',marginBottom:18},
 heroFoot:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'#3B3F45',paddingTop:12,marginTop:15},
 heroFootText:{color:'#898D94',fontSize:7,fontWeight:'900',letterSpacing:1},
 askArrow:{width:29,height:29,borderRadius:10,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
 overviewHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
 sectionTitle:{color:C.text,fontSize:16,fontWeight:'900',letterSpacing:-.2},
 sectionHint:{color:C.faint,fontSize:8,fontWeight:'900',letterSpacing:1},
 sectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:22,marginBottom:11},
 sectionSub:{color:C.muted,fontSize:10,marginTop:4},
 stats:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:17,paddingVertical:14,paddingHorizontal:8,flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginBottom:10},
 stat:{alignItems:'center',flex:1},
 statIcon:{width:30,height:30,borderRadius:10,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center',marginBottom:7},
 statDivider:{width:1,height:43,backgroundColor:C.line},
 progressPanel:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:16,padding:14,marginBottom:4},
 rowBetween:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 progressValue:{color:C.accent,fontSize:19,fontWeight:'900'},
 progressTrack:{height:6,borderRadius:8,backgroundColor:C.surface2,overflow:'hidden',marginTop:13},
 progressFill:{height:6,borderRadius:8,backgroundColor:C.accent},
 moduleGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},
 moduleCard:{width:'48%',minHeight:118,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,borderRadius:16,padding:13,justifyContent:'space-between'},
 moduleCardFeatured:{backgroundColor:'#24262B',borderColor:'#615B50'},
 moduleTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
 moduleIcon:{width:35,height:35,borderRadius:11,backgroundColor:C.surface2,alignItems:'center',justifyContent:'center'},
 moduleTitle:{color:C.text,fontSize:12,fontWeight:'900'},
 moduleSub:{color:C.muted,fontSize:9,marginTop:4},
 textLink:{color:C.accent,fontSize:10,fontWeight:'800'},
 tabScroll:{maxHeight:72,backgroundColor:'#15181D',borderTopWidth:1,borderTopColor:C.line},
 tabItem:{minWidth:68,paddingVertical:10,paddingHorizontal:9,gap:5},
 tabItemActive:{backgroundColor:'#292A2E',borderWidth:1,borderColor:'#4A463E',borderRadius:13},
 card:{backgroundColor:C.surface,borderColor:C.line,borderWidth:1,borderRadius:18,padding:16,marginBottom:15}
,

 splashRoot:{flex:1,backgroundColor:'#0B0C0F',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 splashHalo:{position:'absolute',width:270,height:270,borderRadius:140,backgroundColor:'#BDA47D'},
 splashOrbitStage:{width:190,height:190,alignItems:'center',justifyContent:'center',marginBottom:34},
 splashOrbit:{position:'absolute',width:178,height:178,borderRadius:100,borderWidth:1,borderColor:'rgba(214,197,161,0.42)',borderStyle:'dashed'},
 splashOrbitPoint:{position:'absolute',top:14,left:24,width:9,height:9,borderRadius:5,backgroundColor:'#E8D1A7',shadowColor:'#E8D1A7',shadowOpacity:0.9,shadowRadius:12},
 splashCore:{width:106,height:106,borderRadius:34,borderWidth:1,borderColor:'#A99370',backgroundColor:'#1A1B1F',alignItems:'center',justifyContent:'center',shadowColor:'#D6C5A1',shadowOpacity:0.35,shadowRadius:24,elevation:12},
 splashGlyph:{fontSize:64,fontWeight:'300',color:'#E4D0AB',letterSpacing:-5},
 splashWordmark:{fontSize:30,fontWeight:'300',letterSpacing:11,color:'#F0E7D8',marginLeft:10},
 splashTag:{fontSize:8,letterSpacing:4,color:'#AFA18B',marginTop:9},
 splashRule:{width:46,height:1,backgroundColor:'#BDA47D',marginTop:22,marginBottom:15},
 splashLine:{fontSize:12,color:'#B9B2A7',letterSpacing:1},

 splashBurstRoot:{flex:1,backgroundColor:'#0B0C0F',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 splashBurstFlash:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#F4F5F4',zIndex:5},
 splashBurstMarkWrap:{alignItems:'center',justifyContent:'center',zIndex:2},
 splashBurstBadge:{width:112,height:112,borderRadius:34,backgroundColor:'#171A18',borderWidth:2,borderColor:'#A6DC54',alignItems:'center',justifyContent:'center',shadowColor:'#9CE04F',shadowOpacity:0.55,shadowRadius:26,elevation:10},
 splashBurstGlyph:{fontSize:62,fontWeight:'900',color:'#A6DC54',letterSpacing:-2},
 splashBurstWordmark:{fontSize:32,fontWeight:'900',color:'#F4F5F4',letterSpacing:8,marginTop:16,marginLeft:8},
 splashBurstSubWrap:{position:'absolute',bottom:72,alignItems:'center',zIndex:2},
 splashBurstTag:{fontSize:10,fontWeight:'800',letterSpacing:4,color:'#A6DC54'},


 trhTopBar:{backgroundColor:'#F4F5F4',borderBottomColor:'rgba(23,26,24,0.07)'},
 trhTabScroll:{backgroundColor:'rgba(255,255,255,0.92)',borderTopColor:'rgba(23,26,24,0.08)'},
 trhTabItem:{borderRadius:16},
 trhTabItemActive:{backgroundColor:'#E4F4D4',borderWidth:1,borderColor:'#C5E5A5',borderRadius:16},
 trhPage:{padding:16,paddingBottom:34,backgroundColor:'#F4F5F4',flexGrow:1},
 trhGlowLeft:{position:'absolute',left:-90,top:110,width:240,height:240,borderRadius:120,backgroundColor:'rgba(165,219,130,0.22)'},
 trhGlowRight:{position:'absolute',right:-90,top:280,width:250,height:250,borderRadius:125,backgroundColor:'rgba(183,224,165,0.20)'},
 trhShortcuts:{flexDirection:'row',gap:7,marginBottom:16},
 trhShortcut:{flex:1,minHeight:46,borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.9)',backgroundColor:'rgba(255,255,255,0.72)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,paddingHorizontal:6,shadowColor:'#1E281E',shadowOpacity:0.04,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:1},
 trhShortcutActive:{backgroundColor:'#DFF3CC',borderColor:'#BBE299'},
 trhShortcutText:{fontSize:11,fontWeight:'600',color:'#191D1A'},
 trhShortcutTextActive:{color:'#285C30',fontWeight:'700'},
 trhOrbitWrap:{height:142,alignItems:'center',justifyContent:'center',marginVertical:4},
 trhOrbitRing:{position:'absolute',width:220,height:54,borderRadius:110,borderWidth:1,borderColor:'rgba(143,195,113,0.45)',transform:[{rotate:'-13deg'}]},
 trhOrbitGlow:{width:116,height:116,borderRadius:58,backgroundColor:'rgba(230,250,216,0.85)',borderWidth:2,borderColor:'#FFFFFF',alignItems:'center',justifyContent:'center',shadowColor:'#8BD43A',shadowOpacity:0.35,shadowRadius:18,shadowOffset:{width:0,height:6},elevation:4},
 trhOrbitCore:{width:72,height:72,borderRadius:24,backgroundColor:'#171A18',alignItems:'center',justifyContent:'center'},
 trhOrbitLogo:{fontSize:38,fontWeight:'900',color:'#A6DC54'},
 trhWelcome:{alignItems:'center',marginTop:4,marginBottom:18,paddingHorizontal:12},
 trhWelcomeTitle:{fontSize:28,fontWeight:'800',color:'#111513',letterSpacing:-0.7,marginBottom:6,textAlign:'center'},
 trhWelcomeSub:{fontSize:15,lineHeight:21,color:'#656A6B',textAlign:'center'},
 trhComposer:{minHeight:116,borderRadius:22,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(255,255,255,0.82)',padding:14,marginBottom:24,shadowColor:'#1E2723',shadowOpacity:0.06,shadowRadius:14,shadowOffset:{width:0,height:6},elevation:2},
 trhPromptRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:38},
 trhSpark:{fontSize:20,color:'#77AD32',lineHeight:22},
 trhPromptInput:{flex:1,fontSize:14,color:'#202521',paddingVertical:4},
 trhComposerTools:{flexDirection:'row',alignItems:'center',gap:9,marginTop:12},
 trhToolBtn:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(244,246,245,0.9)',alignItems:'center',justifyContent:'center'},
 trhSendBtn:{width:48,height:48,borderRadius:24,marginLeft:'auto',backgroundColor:'#9CE04F',alignItems:'center',justifyContent:'center',shadowColor:'#8ECD47',shadowOpacity:0.35,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:3},
 trhSection:{marginBottom:22},
 trhSectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10,paddingHorizontal:2},
 trhSectionTitle:{fontSize:17,fontWeight:'800',color:'#171B19',letterSpacing:-0.3},
 trhSectionLink:{fontSize:12,fontWeight:'700',color:'#5C8B29'},
 trhBadgeText:{fontSize:10,fontWeight:'800',color:'#5C8B29',letterSpacing:0.8},
 trhQuickGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:9},
 trhQuickCard:{width:'48.5%',minHeight:78,borderRadius:18,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(255,255,255,0.78)',padding:11,flexDirection:'row',alignItems:'center',gap:9,shadowColor:'#1E281E',shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:1},
 trhCardIconWrap:{width:40,height:40,borderRadius:13,backgroundColor:'#E8F5DC',alignItems:'center',justifyContent:'center'},
 trhCardTitle:{fontSize:13,fontWeight:'700',color:'#1B201D'},
 trhCardSub:{fontSize:10,color:'#7B807D',marginTop:2},
 trhCardArrow:{width:24,height:24,borderRadius:12,backgroundColor:'#ECEFED',alignItems:'center',justifyContent:'center'},
 trhRecentCard:{minHeight:72,borderRadius:20,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(255,255,255,0.82)',padding:12,flexDirection:'row',alignItems:'center',gap:12,shadowColor:'#1E281E',shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:1},
 trhRecentIcon:{width:46,height:46,borderRadius:23,backgroundColor:'#E7F1E4',alignItems:'center',justifyContent:'center'},
 trhStatsBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',borderRadius:18,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(255,255,255,0.78)',paddingVertical:14,marginBottom:8},
 trhStatCol:{flex:1,alignItems:'center'},
 trhStatNum:{fontSize:20,fontWeight:'800',color:'#171A18'},
 trhStatLabel:{fontSize:9,fontWeight:'800',color:'#7B807D',letterSpacing:0.7,marginTop:3},
 trhStatSep:{width:1,height:32,backgroundColor:'rgba(23,26,24,0.08)'},
 trhProgressTrack:{height:6,borderRadius:4,backgroundColor:'#E3E7E4',overflow:'hidden'},
 trhProgressFill:{height:6,borderRadius:4,backgroundColor:'#8BD43A'},
 trhLightCard:{borderRadius:18,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(255,255,255,0.82)',padding:14},
 trhLightInput:{flex:1,backgroundColor:'#F4F6F5',borderWidth:1,borderColor:'#E3E7E4',borderRadius:12,color:'#171A18',minHeight:44,paddingHorizontal:12,paddingVertical:10,fontSize:12},
 trhLightAddBtn:{width:44,height:44,borderRadius:12,backgroundColor:'#9CE04F',alignItems:'center',justifyContent:'center'},
 trhTaskRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderTopWidth:1,borderTopColor:'#ECEFED',marginTop:6},
 trhCheck:{width:20,height:20,borderRadius:7,borderWidth:1.5,borderColor:'#9AA09C',alignItems:'center',justifyContent:'center'},
 trhCheckDone:{backgroundColor:'#9CE04F',borderColor:'#9CE04F'},
 trhTaskText:{flex:1,fontSize:12,color:'#171A18',fontWeight:'500'},
 trhEmptyText:{fontSize:11,color:'#858A86',textAlign:'center',paddingVertical:12},
 trhMiniPill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:13,paddingVertical:9,borderRadius:20,borderWidth:1,borderColor:'#FFFFFF',backgroundColor:'rgba(255,255,255,0.8)'},
 trhMiniPillText:{fontSize:12,fontWeight:'600',color:'#191D1A'},
 trhDayChip:{paddingHorizontal:11,paddingVertical:7,borderRadius:10,backgroundColor:'#F0F2F1',borderWidth:1,borderColor:'#E3E7E4'},
 trhDayChipActive:{backgroundColor:'#DFF3CC',borderColor:'#A6DC54'},
 trhDayChipText:{fontSize:11,fontWeight:'700',color:'#656A6B'},
 trhDayChipTextActive:{color:'#285C30'},
 trhFooter:{textAlign:'center',fontSize:9,color:'#858A86',letterSpacing:1.2,marginTop:8}

});
