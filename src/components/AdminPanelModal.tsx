import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  Square,
  Globe,
  Smartphone,
  MessageSquare,
  GraduationCap,
  Calendar,
  ShoppingBag,
  Users,
  Music,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react-native';
import {
  AdminModule,
  UserProfile,
  AdminRole,
  fetchAllProfiles,
  getUserAdminRoles,
  assignSubAdminRole,
  removeSubAdminRole,
  updateUserMembershipTier,
  deleteUserProfile,
  fetchAllAdminSongs,
  deleteSongByAdmin,
} from '../services/authService';
import {
  fetchPendingEvents,
  updateEventStatus,
  deleteEvent,
  MorpheusEvent,
} from '../services/eventService';
import {
  fetchPendingCoursesAdmin,
  updateCourseStatusAdmin,
  MorpheusCourse,
} from '../services/courseService';
import {
  fetchAllProductsAdmin,
  updateProductStatusAdmin,
  StoreProduct,
} from '../services/storeService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type AdminTab = 'ROLES' | 'USERS' | 'SONGS' | 'EVENTS' | 'COURSES' | 'STORE';

const MODULES: { key: AdminModule; label: string; icon: any }[] = [
  { key: 'PORTAL', label: 'Web Portalı & Akorlar', icon: Globe },
  { key: 'APP', label: 'Morpheus Sahne (App)', icon: Smartphone },
  { key: 'FORUM', label: 'Müzisyen Forumu', icon: MessageSquare },
  { key: 'COURSES', label: 'Müzik Kursları', icon: GraduationCap },
  { key: 'EVENTS', label: 'Etkinlikler & Konser', icon: Calendar },
  { key: 'STORE', label: 'Mağaza & Ekipman', icon: ShoppingBag },
];

export default function AdminPanelModal({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('ROLES');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<Record<AdminModule, AdminRole | null>>({
    PORTAL: null,
    APP: null,
    FORUM: null,
    COURSES: null,
    EVENTS: null,
    STORE: null,
  });
  const [songs, setSongs] = useState<any[]>([]);
  const [adminEvents, setAdminEvents] = useState<MorpheusEvent[]>([]);
  const [adminCourses, setAdminCourses] = useState<MorpheusCourse[]>([]);
  const [adminProducts, setAdminProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    setLoading(true);
    const [profileData, songData, eventData, courseData, productData] = await Promise.all([
      fetchAllProfiles(),
      fetchAllAdminSongs(),
      fetchPendingEvents(),
      fetchPendingCoursesAdmin(),
      fetchAllProductsAdmin(),
    ]);
    setProfiles(profileData);
    setSongs(songData);
    setAdminEvents(eventData);
    setAdminCourses(courseData);
    setAdminProducts(productData);
    if (profileData.length > 0) {
      selectUser(profileData[0]);
    }
    setLoading(false);
  };

  const selectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    const roles = await getUserAdminRoles(user.id);
    const roleMap: Record<AdminModule, AdminRole | null> = {
      PORTAL: null,
      APP: null,
      FORUM: null,
      COURSES: null,
      EVENTS: null,
      STORE: null,
    };
    roles.forEach((r) => {
      roleMap[r.module] = r;
    });
    setUserRoles(roleMap);
  };

  const togglePermission = async (module: AdminModule, permission: 'read' | 'write' | 'delete') => {
    if (!selectedUser) return;
    const current = userRoles[module];
    const canRead = permission === 'read' ? !current?.can_read : current?.can_read ?? true;
    const canWrite = permission === 'write' ? !current?.can_write : current?.can_write ?? false;
    const canDelete = permission === 'delete' ? !current?.can_delete : current?.can_delete ?? false;

    if (!canRead && !canWrite && !canDelete) {
      await removeSubAdminRole(selectedUser.id, module);
      setUserRoles((prev) => ({ ...prev, [module]: null }));
    } else {
      await assignSubAdminRole(selectedUser.id, module, canRead, canWrite, canDelete);
      setUserRoles((prev) => ({
        ...prev,
        [module]: { module, can_read: canRead, can_write: canWrite, can_delete: canDelete },
      }));
    }
  };

  const handleUpdateTier = async (userId: string, newTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
    try {
      await updateUserMembershipTier(userId, newTier);
      setProfiles((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, membership_tier: newTier } : u))
      );
    } catch (err: any) {
      alert('Üyelik güncellenemedi: ' + err.message);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.is_master_admin) {
      alert('Master Admin silinemez!');
      return;
    }
    if (!confirm(`${user.email} kullanıcısını silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteUserProfile(user.id);
      setProfiles((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
    } catch (err: any) {
      alert('Kullanıcı silinemedi: ' + err.message);
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!confirm(`"${songTitle}" şarkısını silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteSongByAdmin(songId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    } catch (err: any) {
      alert('Şarkı silinemedi: ' + err.message);
    }
  };

  const handleEventStatus = async (eventId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateEventStatus(eventId, status);
      setAdminEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status } : e))
      );
    } catch (err: any) {
      alert('Etkinlik durumu güncellenemedi: ' + err.message);
    }
  };

  const handleCourseStatus = async (courseId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateCourseStatusAdmin(courseId, status);
      setAdminCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status } : c))
      );
    } catch (err: any) {
      alert('Kurs durumu güncellenemedi: ' + err.message);
    }
  };

  const handleProductStatus = async (productId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateProductStatusAdmin(productId, status);
      setAdminProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status } : p))
      );
    } catch (err: any) {
      alert('İlan durumu güncellenemedi: ' + err.message);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.full_name && p.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck color="#38BDF8" size={20} />
              <Text style={styles.headerTitle}>Master Admin Yönetim Merkezi</Text>
            </View>

            {/* TAB SEÇİCİ */}
            <View style={styles.tabGroup}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'ROLES' && styles.tabBtnActive]}
                onPress={() => setActiveTab('ROLES')}
              >
                <ShieldCheck color={activeTab === 'ROLES' ? '#38BDF8' : '#64748B'} size={13} />
                <Text style={[styles.tabText, activeTab === 'ROLES' && styles.tabTextActive]}>
                  Yetkiler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'USERS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('USERS')}
              >
                <Users color={activeTab === 'USERS' ? '#38BDF8' : '#64748B'} size={13} />
                <Text style={[styles.tabText, activeTab === 'USERS' && styles.tabTextActive]}>
                  Üyeler ({profiles.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'SONGS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('SONGS')}
              >
                <Music color={activeTab === 'SONGS' ? '#38BDF8' : '#64748B'} size={13} />
                <Text style={[styles.tabText, activeTab === 'SONGS' && styles.tabTextActive]}>
                  Şarkılar ({songs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'EVENTS' && styles.tabBtnActive]}
                onPress={() => setActiveTab('EVENTS')}
              >
                <Calendar color={activeTab === 'EVENTS' ? '#38BDF8' : '#64748B'} size={13} />
                <Text style={[styles.tabText, activeTab === 'EVENTS' && styles.tabTextActive]}>
                  Etkinlik ({adminEvents.filter(e => e.status === 'PENDING').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'COURSES' && styles.tabBtnActive]}
                onPress={() => setActiveTab('COURSES')}
              >
                <GraduationCap color={activeTab === 'COURSES' ? '#38BDF8' : '#64748B'} size={13} />
                <Text style={[styles.tabText, activeTab === 'COURSES' && styles.tabTextActive]}>
                  Kurs ({adminCourses.filter(c => c.status === 'PENDING').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'STORE' && styles.tabBtnActive]}
                onPress={() => setActiveTab('STORE')}
              >
                <ShoppingBag color={activeTab === 'STORE' ? '#38BDF8' : '#64748B'} size={13} />
                <Text style={[styles.tabText, activeTab === 'STORE' && styles.tabTextActive]}>
                  Pazar ({adminProducts.filter(p => p.status === 'PENDING').length})
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={18} />
            </TouchableOpacity>
          </View>

          {/* BODY */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={{ color: '#94A3B8', marginTop: 10, fontSize: 12 }}>Yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.body}>
              {/* SEKME 1: YETKİ MATRİSİ */}
              {activeTab === 'ROLES' && (
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <View style={styles.userListCol}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Kullanıcı ara..."
                      placeholderTextColor="#64748B"
                      value={search}
                      onChangeText={setSearch}
                    />
                    <ScrollView style={{ flex: 1 }}>
                      {filteredProfiles.map((p) => {
                        const isSelected = selectedUser?.id === p.id;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={[styles.userCard, isSelected && styles.userCardActive]}
                            onPress={() => selectUser(p)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.userEmail} numberOfLines={1}>{p.email}</Text>
                              <Text style={styles.userName}>{p.full_name || 'İsimsiz Üye'}</Text>
                            </View>
                            {p.is_master_admin ? (
                              <View style={styles.masterBadge}><Text style={styles.badgeText}>MASTER</Text></View>
                            ) : (
                              <View style={styles.tierBadge}><Text style={styles.tierText}>{p.membership_tier}</Text></View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.roleConfigCol}>
                    {selectedUser ? (
                      <>
                        <View style={styles.selectedUserInfo}>
                          <UserCheck color="#38BDF8" size={16} />
                          <Text style={styles.selectedUserTitle}>
                            {selectedUser.full_name || selectedUser.email} - Modül İzinleri
                          </Text>
                          {selectedUser.is_master_admin && (
                            <Text style={styles.masterNotice}>(Master Admin tam yetkiye sahiptir)</Text>
                          )}
                        </View>

                        <ScrollView style={{ flex: 1 }}>
                          {MODULES.map((mod) => {
                            const Icon = mod.icon;
                            const role = userRoles[mod.key];
                            const isMaster = selectedUser.is_master_admin;

                            return (
                              <View key={mod.key} style={styles.moduleRow}>
                                <View style={styles.moduleMeta}>
                                  <Icon color="#94A3B8" size={16} />
                                  <Text style={styles.moduleName}>{mod.label}</Text>
                                </View>

                                <View style={styles.permGroup}>
                                  <TouchableOpacity
                                    disabled={isMaster}
                                    style={styles.permCheck}
                                    onPress={() => togglePermission(mod.key, 'read')}
                                  >
                                    {isMaster || role?.can_read ? (
                                      <CheckSquare color="#38BDF8" size={16} />
                                    ) : (
                                      <Square color="#475569" size={16} />
                                    )}
                                    <Text style={styles.permLabel}>Gör</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    disabled={isMaster}
                                    style={styles.permCheck}
                                    onPress={() => togglePermission(mod.key, 'write')}
                                  >
                                    {isMaster || role?.can_write ? (
                                      <CheckSquare color="#10B981" size={16} />
                                    ) : (
                                      <Square color="#475569" size={16} />
                                    )}
                                    <Text style={styles.permLabel}>Yaz</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    disabled={isMaster}
                                    style={styles.permCheck}
                                    onPress={() => togglePermission(mod.key, 'delete')}
                                  >
                                    {isMaster || role?.can_delete ? (
                                      <CheckSquare color="#EF4444" size={16} />
                                    ) : (
                                      <Square color="#475569" size={16} />
                                    )}
                                    <Text style={styles.permLabel}>Sil</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </>
                    ) : (
                      <Text style={styles.emptyText}>Yetkilendirmek için soldan bir kullanıcı seçin.</Text>
                    )}
                  </View>
                </View>
              )}

              {/* SEKME 2: ÜYE YÖNETİMİ */}
              {activeTab === 'USERS' && (
                <View style={styles.fullTabContent}>
                  <View style={styles.tabHeaderFilter}>
                    <Search color="#64748B" size={15} />
                    <TextInput
                      style={styles.searchBarInput}
                      placeholder="E-posta veya isim ara..."
                      placeholderTextColor="#64748B"
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>

                  <ScrollView style={{ flex: 1 }}>
                    {filteredProfiles.map((user) => (
                      <View key={user.id} style={styles.fullTableRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.rowMainText}>{user.email}</Text>
                            {user.is_master_admin && (
                              <View style={styles.masterBadge}><Text style={styles.badgeText}>MASTER</Text></View>
                            )}
                          </View>
                          <Text style={styles.rowSubText}>{user.full_name || 'İsimsiz'}</Text>
                        </View>

                        <View style={styles.tierButtonGroup}>
                          {(['FREE', 'BASIC', 'PREMIUM'] as const).map((t) => (
                            <TouchableOpacity
                              key={t}
                              disabled={user.is_master_admin}
                              style={[
                                styles.tierOptionBtn,
                                user.membership_tier === t && styles.tierOptionBtnActive,
                              ]}
                              onPress={() => handleUpdateTier(user.id, t)}
                            >
                              <Text
                                style={[
                                  styles.tierOptionText,
                                  user.membership_tier === t && styles.tierOptionTextActive,
                                ]}
                              >
                                {t}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {!user.is_master_admin && (
                          <TouchableOpacity
                            style={styles.deleteActionBtn}
                            onPress={() => handleDeleteUser(user)}
                          >
                            <Trash2 color="#EF4444" size={16} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* SEKME 3: ŞARKILAR */}
              {activeTab === 'SONGS' && (
                <View style={styles.fullTabContent}>
                  <View style={styles.tabHeaderFilter}>
                    <Search color="#64748B" size={15} />
                    <TextInput
                      style={styles.searchBarInput}
                      placeholder="Şarkı veya sanatçı ara..."
                      placeholderTextColor="#64748B"
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>

                  <ScrollView style={{ flex: 1 }}>
                    {filteredSongs.map((song) => (
                      <View key={song.id} style={styles.fullTableRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowMainText}>{song.title}</Text>
                          <Text style={styles.rowSubText}>
                            {song.artist} • Ton: {song.original_key} • {song.genre || 'Rock'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteActionBtn}
                          onPress={() => handleDeleteSong(song.id, song.title)}
                        >
                          <Trash2 color="#EF4444" size={16} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* SEKME 4: ETKİNLİKLER */}
              {activeTab === 'EVENTS' && (
                <View style={styles.fullTabContent}>
                  <ScrollView style={{ flex: 1 }}>
                    {adminEvents.map((ev) => (
                      <View key={ev.id} style={styles.fullTableRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.rowMainText}>{ev.title}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                ev.status === 'APPROVED' && { backgroundColor: '#064E3B' },
                                ev.status === 'PENDING' && { backgroundColor: '#78350F' },
                                ev.status === 'REJECTED' && { backgroundColor: '#7F1D1D' },
                              ]}
                            >
                              <Text style={styles.statusBadgeText}>{ev.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.rowSubText}>
                            {ev.venue}, {ev.city} • {new Date(ev.event_date).toLocaleDateString('tr-TR')} • {ev.ticket_price}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          {ev.status !== 'APPROVED' && (
                            <TouchableOpacity
                              style={styles.approveBtn}
                              onPress={() => handleEventStatus(ev.id, 'APPROVED')}
                            >
                              <CheckCircle color="#10B981" size={15} />
                              <Text style={styles.actionBtnText}>Onayla</Text>
                            </TouchableOpacity>
                          )}

                          {ev.status !== 'REJECTED' && (
                            <TouchableOpacity
                              style={styles.rejectBtn}
                              onPress={() => handleEventStatus(ev.id, 'REJECTED')}
                            >
                              <XCircle color="#F59E0B" size={15} />
                              <Text style={styles.actionBtnText}>Reddet</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                    {adminEvents.length === 0 && (
                      <Text style={styles.emptyText}>Henüz listelenecek etkinlik yok.</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* SEKME 5: KURSLAR */}
              {activeTab === 'COURSES' && (
                <View style={styles.fullTabContent}>
                  <ScrollView style={{ flex: 1 }}>
                    {adminCourses.map((c) => (
                      <View key={c.id} style={styles.fullTableRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.rowMainText}>{c.title}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                c.status === 'APPROVED' && { backgroundColor: '#064E3B' },
                                c.status === 'PENDING' && { backgroundColor: '#78350F' },
                                c.status === 'REJECTED' && { backgroundColor: '#7F1D1D' },
                              ]}
                            >
                              <Text style={styles.statusBadgeText}>{c.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.rowSubText}>
                            {c.instrument} • {c.level} • {c.is_free ? 'Ücretsiz' : `${c.price_amount} TL`} • Eğitmen: {c.instructor?.full_name || 'Bilinmiyor'}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          {c.status !== 'APPROVED' && (
                            <TouchableOpacity
                              style={styles.approveBtn}
                              onPress={() => handleCourseStatus(c.id, 'APPROVED')}
                            >
                              <CheckCircle color="#10B981" size={15} />
                              <Text style={styles.actionBtnText}>Onayla</Text>
                            </TouchableOpacity>
                          )}

                          {c.status !== 'REJECTED' && (
                            <TouchableOpacity
                              style={styles.rejectBtn}
                              onPress={() => handleCourseStatus(c.id, 'REJECTED')}
                            >
                              <XCircle color="#F59E0B" size={15} />
                              <Text style={styles.actionBtnText}>Reddet</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                    {adminCourses.length === 0 && (
                      <Text style={styles.emptyText}>Henüz onay bekleyen kurs başvurusu yok.</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* SEKME 6: MAĞAZA / EKİPMAN */}
              {activeTab === 'STORE' && (
                <View style={styles.fullTabContent}>
                  <ScrollView style={{ flex: 1 }}>
                    {adminProducts.map((p) => (
                      <View key={p.id} style={styles.fullTableRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.rowMainText}>{p.title}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                p.status === 'APPROVED' && { backgroundColor: '#064E3B' },
                                p.status === 'PENDING' && { backgroundColor: '#78350F' },
                                p.status === 'REJECTED' && { backgroundColor: '#7F1D1D' },
                              ]}
                            >
                              <Text style={styles.statusBadgeText}>{p.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.rowSubText}>
                            {p.category} • {p.condition === 'NEW' ? 'Sıfır' : '2. El'} • {Number(p.price).toLocaleString('tr-TR')} TL • {p.city} • Tel: {p.contact_info}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          {p.status !== 'APPROVED' && (
                            <TouchableOpacity
                              style={styles.approveBtn}
                              onPress={() => handleProductStatus(p.id, 'APPROVED')}
                            >
                              <CheckCircle color="#10B981" size={15} />
                              <Text style={styles.actionBtnText}>Onayla</Text>
                            </TouchableOpacity>
                          )}

                          {p.status !== 'REJECTED' && (
                            <TouchableOpacity
                              style={styles.rejectBtn}
                              onPress={() => handleProductStatus(p.id, 'REJECTED')}
                            >
                              <XCircle color="#F59E0B" size={15} />
                              <Text style={styles.actionBtnText}>Reddet</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                    {adminProducts.length === 0 && (
                      <Text style={styles.emptyText}>Henüz onay bekleyen ekipman ilanı yok.</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 980, height: 600, backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#161F30', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  closeBtn: { padding: 4 },

  tabGroup: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 6, padding: 2, gap: 3 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  tabBtnActive: { backgroundColor: '#1E293B' },
  tabText: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  tabTextActive: { color: '#38BDF8' },

  body: { flex: 1, flexDirection: 'row' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  userListCol: { width: 280, borderRightWidth: 1, borderRightColor: '#1E293B', padding: 10, backgroundColor: '#090E1A' },
  searchInput: { backgroundColor: '#161F30', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, color: '#F8FAFC', fontSize: 12, marginBottom: 8, outlineStyle: 'none' } as any,
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 6, backgroundColor: '#0F172A', marginBottom: 5, borderWidth: 1, borderColor: '#1E293B' },
  userCardActive: { borderColor: '#38BDF8', backgroundColor: '#1E293B' },
  userEmail: { color: '#F8FAFC', fontSize: 11, fontWeight: 'bold' },
  userName: { color: '#64748B', fontSize: 10, marginTop: 1 },
  masterBadge: { backgroundColor: '#312E81', paddingVertical: 1, paddingHorizontal: 5, borderRadius: 4 },
  badgeText: { color: '#818CF8', fontSize: 9, fontWeight: '900' },
  tierBadge: { backgroundColor: '#1E293B', paddingVertical: 1, paddingHorizontal: 5, borderRadius: 4 },
  tierText: { color: '#94A3B8', fontSize: 9, fontWeight: 'bold' },

  roleConfigCol: { flex: 1, padding: 16, backgroundColor: '#0F172A' },
  selectedUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  selectedUserTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  masterNotice: { color: '#F59E0B', fontSize: 10, fontStyle: 'italic' },

  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161F30', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B' },
  moduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  moduleName: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
  permGroup: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  permCheck: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  permLabel: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

  fullTabContent: { flex: 1, padding: 16 },
  tabHeaderFilter: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#161F30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#1E293B' },
  searchBarInput: { flex: 1, color: '#F8FAFC', fontSize: 12, outlineStyle: 'none' } as any,
  fullTableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161F30', padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#1E293B' },
  rowMainText: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  rowSubText: { color: '#64748B', fontSize: 11, marginTop: 2 },

  statusBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  statusBadgeText: { color: '#F8FAFC', fontSize: 9, fontWeight: '900' },
  approveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064E3B', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 5 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#78350F', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 5 },
  actionBtnText: { color: '#F8FAFC', fontSize: 10, fontWeight: 'bold' },

  tierButtonGroup: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 4, padding: 2, gap: 2, marginRight: 8 },
  tierOptionBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 3 },
  tierOptionBtnActive: { backgroundColor: '#0284C7' },
  tierOptionText: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
  tierOptionTextActive: { color: '#FFFFFF' },
  deleteActionBtn: { padding: 6, backgroundColor: '#2D1515', borderRadius: 6, borderWidth: 1, borderColor: '#7F1D1D' },
  emptyText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 40 },
});