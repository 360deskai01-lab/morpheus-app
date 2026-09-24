import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({
  visible,
  onClose,
  onSuccess,
  initialMode = 'login'
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim() || email.split('@')[0]
            }
          }
        });
        if (error) throw error;

        // Profil kaydı açılmadıysa morfeus_profiles tablosuna ekle
        if (data.user) {
          await supabase.from('morfeus_profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName.trim() || email.split('@')[0],
            membership_tier: 'basic',
          });
        }
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Kimlik doğrulama işlemi başarısız.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Kapat Butonu */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Başlık */}
          <Text style={styles.brandTitle}>MORPHEUS <Text style={styles.brandSub}>v3.6</Text></Text>
          <Text style={styles.modalHeading}>
            {mode === 'login' ? 'Hesabınıza Giriş Yapın' : 'Morpheus Hesabı Oluşturun'}
          </Text>

          {/* Sekmeler */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'login' && styles.activeTabBtn]}
              onPress={() => {
                setMode('login');
                setErrorMessage('');
              }}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'register' && styles.activeTabBtn]}
              onPress={() => {
                setMode('register');
                setErrorMessage('');
              }}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          {/* Form Alanları */}
          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ad Soyad / Sahne Adı</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Tolga Bora Şahin"
                placeholderTextColor="#64748b"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-Posta Adresi</Text>
            <TextInput
              style={styles.textInput}
              placeholder="eposta@ornek.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          ) : null}

          {/* Gönder Butonu */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            🔒 Supabase Auth 256-Bit SSL korumalı şifreleme altyapısı.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  closeBtnText: { color: '#94a3b8', fontSize: 16, fontWeight: '700' },
  brandTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  brandSub: { color: '#38bdf8', fontSize: 11 },
  modalHeading: { color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#090d16', borderRadius: 8, padding: 3, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTabBtn: { backgroundColor: '#0284c7' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#ffffff' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  textInput: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13
  },
  errorText: { color: '#f87171', fontSize: 11, marginBottom: 10, textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6
  },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  footerNote: { color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 14 }
});