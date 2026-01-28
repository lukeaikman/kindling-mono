import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { useAuth } from '../../src/hooks/useAuth';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

const emailRegex = /\S+@\S+\.\S+/;

export default function SecureAccountScreen() {
  const { willActions } = useAppState();
  const { register, validateEmail } = useAuth();
  const user = willActions.getUser();
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

  const emailValid = useMemo(() => emailRegex.test(email), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const passwordsMatch = useMemo(() => confirmPassword.length > 0 && password === confirmPassword, [password, confirmPassword]);

  useEffect(() => {
    if (!emailValid) {
      setEmailAvailable(null);
      setEmailChecking(false);
      return;
    }

    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const result = await validateEmail(email.trim());
        setEmailAvailable(result.available);
      } catch (error) {
        setEmailAvailable(null);
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, emailValid, validateEmail]);

  const handleSecureAccount = async () => {
    setErrorMessage(null);

    if (!firstName || !lastName) {
      setErrorMessage('We could not find your details. Please restart onboarding.');
      return;
    }

    if (!emailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (emailAvailable === false) {
      setErrorMessage('This email is already registered.');
      return;
    }

    if (!passwordValid) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        first_name: firstName,
        last_name: lastName,
      });
      router.replace('/order-of-things');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
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
          <View style={styles.logoBlock}>
            <KindlingLogo size="md" variant="dark" showText />
            <Text style={styles.title}>Secure your will</Text>
            <Text style={styles.subtitle}>
              You&apos;ve made great progress{firstName ? `, ${firstName}` : ''}. Let&apos;s secure your information.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              type="email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              error={email.length > 0 && (!emailValid || emailAvailable === false)}
              errorMessage={
                email.length === 0
                  ? undefined
                  : !emailValid
                  ? 'Enter a valid email address'
                  : emailAvailable === false
                  ? 'Email already registered'
                  : undefined
              }
            />
            {emailChecking ? <Text style={styles.helperText}>Checking email availability...</Text> : null}
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              type="password"
              placeholder="Create a password"
              autoCapitalize="none"
              autoCorrect={false}
              error={password.length > 0 && !passwordValid}
              errorMessage={!passwordValid && password.length > 0 ? 'Password must be at least 8 characters' : undefined}
            />
            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              type="password"
              placeholder="Re-enter your password"
              autoCapitalize="none"
              autoCorrect={false}
              error={confirmPassword.length > 0 && !passwordsMatch}
              errorMessage={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button variant="primary" onPress={handleSecureAccount} disabled={submitting} loading={submitting}>
              Create Account & Continue
            </Button>
          </View>

          {/* TODO: Social Login (Phase 5)
              Add Apple and Google sign-in buttons here when backend OAuth is implemented. */}
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
  helperText: {
    color: KindlingColors.brown,
    fontSize: Typography.fontSize.xs,
  },
  actions: {
    gap: Spacing.md,
  },
  errorText: {
    color: KindlingColors.destructive,
    marginTop: Spacing.xs,
  },
});
