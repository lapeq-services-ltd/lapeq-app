import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function usePushToken(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    async function register() {
      // Push tokens only work on real devices
      if (!Device.isDevice) return

      // Ask for permission
      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') return

      // Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Lapeq',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#c9a84c',
        })
      }

      // Get the Expo push token — projectId is required for SDK 50+
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
      const token = tokenData.data

      // Upsert to Supabase — one row per user+token combo
      await supabase.from('push_tokens').upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: 'token' }
      )
    }

    register().catch(console.warn)
  }, [userId])
}
