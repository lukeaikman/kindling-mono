import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Text } from 'react-native-paper';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAuth } from '../../src/hooks/useAuth';
import { useNetworkState } from '../../src/hooks/useNetworkState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

const emailRegex = /\S+@\S+\.\S+/;

export default function LoginScreen() {
  const { login } = useAuth();
  const { isConnected, isInternetReachable } = useNetworkState();
  const params = useLocalSearchParams<{ welcomeBack?: string; firstName?: string }>();
  const isWelcomeBack = params.welcomeBack === 'true';
  const firstName = params.firstName;
  const [manualOnline, setManualOnline] = useState(false);
  const isOffline = !manualOnline && (!isConnected || !isInternetReachable);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef(0);

  const emailError = useMemo(() => email.length > 0 && !emailRegex.test(email), [email]);
  const passwordError = useMemo(() => password.length > 0 && password.length < 8, [password]);

  useEffect(() => {
    if (!isConnected || !isInternetReachable) {
      setManualOnline(false);
    }
  }, [isConnected, isInternetReachable]);

  const handleRefreshConnectivity = async () => {
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      setManualOnline(response.ok);
    } catch {
      setManualOnline(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/order-of-things');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Coming soon', 'Password reset will be available in a later phase.');
  };

  const handleHeaderPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      router.push('/developer/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.8}>
            <View style={styles.logoBlock}>
              <KindlingLogo size="md" variant="dark" showText />
              <Text style={styles.title}>
                {isWelcomeBack && firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>Sign in to continue building your will.</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.form, isOffline && styles.formDisabled]}>
            {isOffline && (
              <View style={styles.offlineBanner}>
                <View style={styles.offlineHeader}>
                  <Text style={styles.offlineTitle}>You&apos;re offline</Text>
                  <IconButton
                    icon="refresh"
                    size={18}
                    iconColor={KindlingColors.destructive}
                    style={styles.offlineRefresh}
                    onPress={handleRefreshConnectivity}
                  />
                </View>
                <Text style={styles.offlineMessage}>
                  Please connect to the internet to sign in.
                </Text>
              </View>
            )}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              type="email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              errorMessage={emailError ? 'Enter a valid email address' : undefined}
              disabled={isOffline}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              type="password"
              placeholder="Enter your password"
              autoCapitalize="none"
              autoCorrect={false}
              error={passwordError}
              errorMessage={passwordError ? 'Password must be at least 8 characters' : undefined}
              disabled={isOffline}
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button variant="primary" onPress={handleLogin} disabled={submitting || isOffline} loading={submitting}>
              Sign In
            </Button>
            <Text style={styles.linkText} onPress={() => router.push('/onboarding/welcome')}>
              New to Kindling? Register
            </Text>
            <Text style={styles.linkMuted} onPress={handleForgotPassword}>
              Forgot password?
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.cream,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
    gap: Spacing.xl,
  },
  logoBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.sm,
  },
  formDisabled: {
    opacity: 0.6,
  },
  offlineBanner: {
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(210, 62, 62, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(210, 62, 62, 0.3)',
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineTitle: {
    color: KindlingColors.destructive,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  offlineRefresh: {
    margin: 0,
  },
  offlineMessage: {
    marginTop: Spacing.xs,
    color: KindlingColors.brown,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
  linkText: {
    textAlign: 'center',
    color: KindlingColors.navy,
    fontWeight: Typography.fontWeight.semibold,
  },
  linkMuted: {
    textAlign: 'center',
    color: KindlingColors.brown,
  },
  errorText: {
    color: KindlingColors.destructive,
    marginTop: Spacing.xs,
  },
});
