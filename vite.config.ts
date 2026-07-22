/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "esnext",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("react-oidc-context") || id.includes("oidc-client-ts")) return "vendor-auth";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "vendor-react";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      clean: false,
      reporter: ["text", "html", "lcov"],
      include: [
        "src/utils/**/*.ts",
        "src/services/api.ts",
        "src/services/activityService.ts",
        "src/services/userService.ts",
        "src/services/adminService.ts",
        "src/services/activityTypeService.ts",
        "src/components/activity/ActivityDatePicker.tsx",
        "src/components/activity/ActivityTimeSelect.tsx",
        "src/components/activity/activityFormUtils.ts",
        "src/components/activity/OffSiteAddressFields.tsx",
        "src/components/ui/MessageModal.tsx",
        "src/components/home/HomeWelcomeSection.tsx",
        "src/components/admin/StatCard.tsx",
        "src/components/admin/ActivityTypeFormModal.tsx",
        "src/components/admin/ActivityMetaBadges.tsx",
        "src/components/admin/ActivityStatusBadge.tsx",
        "src/pages/HomePage.tsx",
        "src/pages/ExplorePage.tsx",
        "src/pages/PlanningPage.tsx",
        "src/pages/ProfilePage.tsx",
        "src/pages/admin/AdminDashboardPage.tsx",
        "src/pages/admin/AdminUsersPage.tsx",
        "src/pages/admin/AdminActivitiesPage.tsx",
        "src/pages/admin/AdminActivityTypesPage.tsx",
      ],
      thresholds: {
        "src/utils/**": { lines: 100, functions: 100, branches: 100 },
        "src/services/**": { lines: 80, functions: 80, branches: 70 },
        "src/components/**": { lines: 80, functions: 80 },
        lines: 70,
        functions: 60,
        branches: 60,
      },
    },
  },
})