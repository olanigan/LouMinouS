# Phase 4: User Experience and Interfaces

## Summary

This phase implements the user interfaces using:

1. Next.js App Router
2. React Server Components
3. Shadcn UI (for core components)
4. Magic UI (for enhanced interactions)
5. Aceternity UI (for advanced animations)
6. Tailwind CSS

**Key Components:**

- Student dashboard with animated transitions
- Instructor interface with floating elements
- Admin controls with morphing effects
- Course viewer with smooth animations
- Authentication flows with motion effects

**Expected Outcome:** A complete UI system with:

- Beautiful, animated layouts
- Interactive, floating components
- Smooth transitions
- Micro-interactions
- Role-based interfaces
- Accessible design

## 4.1 UI Dependencies Setup

### Install Shadcn UI

```bash
# Initialize Shadcn UI
pnpm dlx shadcn-ui@latest init

# Install core components
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add form
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add label
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add dropdown-menu
pnpm dlx shadcn-ui@latest add avatar
pnpm dlx shadcn-ui@latest add tabs
```

### Install Aceternity UI

```bash
# Install Aceternity UI dependencies
pnpm add framer-motion @tabler/icons-react clsx tailwind-merge
pnpm add @legendapp/motion
pnpm add @formkit/auto-animate

# Add Aceternity components
pnpm add aceternity-ui
```

### Install Magic UI

```bash
# Install Magic UI and its dependencies
pnpm add magic-ui
pnpm add @magic-ui/animations
pnpm add @magic-ui/transitions
```

### Configure Tailwind CSS

Update `tailwind.config.ts`:

```typescript
import { withTV } from "tailwind-variants";
import animatePlugin from "tailwindcss-animate";

export default withTV({
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: ["class"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				spotlight: "spotlight 2s ease .75s 1 forwards",
				shimmer: "shimmer 2s linear infinite",
				"meteor-effect": "meteor 5s linear infinite",
			},
			keyframes: {
				spotlight: {
					"0%": { opacity: "0", transform: "scale(0.9)" },
					"100%": { opacity: "1", transform: "scale(1)" },
				},
				shimmer: {
					from: { backgroundPosition: "0 0" },
					to: { backgroundPosition: "-200% 0" },
				},
				meteor: {
					"0%": {
						transform: "rotate(215deg) translateX(0)",
						opacity: "1",
					},
					"70%": { opacity: "1" },
					"100%": {
						transform: "rotate(215deg) translateX(-500px)",
						opacity: "0",
					},
				},
			},
		},
	},
	plugins: [
		animatePlugin,
		require("@tailwindcss/typography"),
		require("tailwindcss-animate"),
	],
});
```

## 4.2 Enhanced Components

### Import Aceternity Components

Create `components/ui/aceternity/index.ts`:

```typescript
"use client";

export {
	AnimatedCard,
	BackgroundBeams,
	FloatingNavbar,
	SparklesCore,
	TextGenerateEffect,
	TypewriterEffect,
	WavyBackground,
} from "aceternity-ui";
```

### Import Shadcn Components

Create `components/ui/shadcn/index.ts`:

```typescript
"use client";

export { Button } from "./button";
export { Card } from "./card";
export { Form } from "./form";
export { Input } from "./input";
export { Label } from "./label";
export { Toast } from "./toast";
export { Dialog } from "./dialog";
export { DropdownMenu } from "./dropdown-menu";
export { Avatar } from "./avatar";
export { Tabs } from "./tabs";
```

### Import Magic UI Components

Create `components/ui/magic/index.ts`:

```typescript
"use client";

export {
	FloatingEffect,
	GlowEffect,
	MagicCard,
	MagicContainer,
	ParallaxText,
	SmoothTransition,
} from "magic-ui";
```

## 4.3 Enhanced Page Components

### Create Animated Login Page

Update `app/(auth)/login/page.tsx`:

```typescript
import { Metadata } from "next";
import {
	AnimatedCard,
	BackgroundBeams,
} from "@/components/ui/aceternity";
import { MagicCard } from "@/components/ui/magic";
import {
	Button,
	Form,
	Input,
} from "@/components/ui/shadcn";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
	title: "Login | LMS Platform",
	description: "Login to your account",
};

export default function LoginPage() {
	return (
		<div className="relative min-h-screen">
			<BackgroundBeams className="opacity-30" />
			<div className="container relative flex min-h-screen items-center justify-center">
				<MagicCard>
					<AnimatedCard className="w-full max-w-md space-y-6 p-8">
						<div className="flex flex-col space-y-2 text-center">
							<Logo className="mx-auto h-10 w-10" />
							<h1 className="text-2xl font-semibold tracking-tight">
								Welcome back
							</h1>
							<p className="text-sm text-muted-foreground">
								Enter your credentials to sign in
							</p>
						</div>
						<LoginForm />
					</AnimatedCard>
				</MagicCard>
			</div>
		</div>
	);
}
```

### Create Animated Dashboard

Update `app/(dashboard)/student/page.tsx`:

```typescript
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import {
	AnimatedCard,
	BackgroundBeams,
	SparklesCore,
} from "@/components/ui/aceternity";
import {
	MagicCard,
	MagicContainer,
	ParallaxText,
} from "@/components/ui/magic";
import { Card, Tabs, Button } from "@/components/ui/shadcn";
import { CourseGrid } from "@/components/course/grid";
import { ProgressStats } from "@/components/progress/stats";
import { AchievementList } from "@/components/achievement/list";
import { LeaderboardCard } from "@/components/leaderboard/card";
import { LoadingSkeleton } from "@/components/ui/loading";

export default async function StudentDashboard() {
	const user = await getCurrentUser();

	if (!user || user.role !== "student") {
		redirect("/");
	}

	return (
		<MagicContainer>
			<div className="relative min-h-screen">
				<BackgroundBeams className="opacity-10" />
				<SparklesCore
					id="tsparticles"
					background="transparent"
					minSize={0.6}
					maxSize={1.4}
					particleDensity={100}
					className="absolute inset-0 h-full w-full"
				/>
				<div className="space-y-8 p-8">
					<ParallaxText baseVelocity={-5}>
						<h1 className="text-4xl font-bold">
							Welcome back, {user.name}!
						</h1>
					</ParallaxText>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Suspense fallback={<LoadingSkeleton />}>
							<ProgressStats userId={user.id} />
						</Suspense>
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<MagicCard>
								<Card className="p-6">
									<h2 className="mb-4 text-2xl font-semibold">
										Your Courses
									</h2>
									<Suspense fallback={<LoadingSkeleton />}>
										<CourseGrid userId={user.id} />
									</Suspense>
								</Card>
							</MagicCard>
						</div>

						<div className="space-y-6">
							<AnimatedCard>
								<Card className="p-6">
									<h2 className="mb-4 text-2xl font-semibold">
										Achievements
									</h2>
									<Suspense fallback={<LoadingSkeleton />}>
										<AchievementList userId={user.id} />
									</Suspense>
								</Card>
							</AnimatedCard>

							<MagicCard>
								<Card className="p-6">
									<h2 className="mb-4 text-2xl font-semibold">
										Leaderboard
									</h2>
									<Suspense fallback={<LoadingSkeleton />}>
										<LeaderboardCard userId={user.id} />
									</Suspense>
								</Card>
							</MagicCard>
						</div>
					</div>
				</div>
			</div>
		</MagicContainer>
	);
}
```

### Create Course Viewer

Update `app/(dashboard)/courses/[courseId]/page.tsx`:

```typescript
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCourse } from "@/lib/courses";
import {
	AnimatedCard,
	TextGenerateEffect,
	WavyBackground,
} from "@/components/ui/aceternity";
import {
	MagicCard,
	FloatingEffect,
} from "@/components/ui/magic";
import { Card, Tabs, Button } from "@/components/ui/shadcn";
import { ModuleList } from "@/components/module/list";
import { CourseProgress } from "@/components/course/progress";
import { CourseInfo } from "@/components/course/info";
import { LoadingSkeleton } from "@/components/ui/loading";

export default async function CoursePage({
	params,
}: {
	params: { courseId: string };
}) {
	const user = await getCurrentUser();
	const course = await getCourse(params.courseId);

	if (!course) {
		notFound();
	}

	return (
		<div className="relative min-h-screen">
			<WavyBackground className="opacity-20" />
			<div className="container mx-auto px-4 py-8">
				<FloatingEffect>
					<div className="mb-8">
						<TextGenerateEffect words={course.title} />
						<p className="mt-2 text-muted-foreground">
							{course.description}
						</p>
					</div>
				</FloatingEffect>

				<div className="grid gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<MagicCard>
							<Card className="p-6">
								<Tabs defaultValue="modules">
									<Tabs.List>
										<Tabs.Trigger value="modules">
											Modules
										</Tabs.Trigger>
										<Tabs.Trigger value="overview">
											Overview
										</Tabs.Trigger>
									</Tabs.List>
									<Tabs.Content value="modules">
										<Suspense
											fallback={<LoadingSkeleton />}
										>
											<ModuleList courseId={course.id} />
										</Suspense>
									</Tabs.Content>
									<Tabs.Content value="overview">
										<CourseInfo course={course} />
									</Tabs.Content>
								</Tabs>
							</Card>
						</MagicCard>
					</div>

					<div>
						<AnimatedCard>
							<Card className="p-6">
								<h2 className="mb-4 text-xl font-semibold">
									Your Progress
								</h2>
								<Suspense fallback={<LoadingSkeleton />}>
									<CourseProgress
										userId={user.id}
										courseId={course.id}
									/>
								</Suspense>
							</Card>
						</AnimatedCard>
					</div>
				</div>
			</div>
		</div>
	);
}
```

## 4.4 Testing

### Component Testing

Create `__tests__/components/ui/card.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { MagicCard } from "@/components/ui/magic";
import { Card } from "@/components/ui/shadcn";

describe("Card Components", () => {
	it("renders MagicCard with children", () => {
		render(
			<MagicCard>
				<div>Test Content</div>
			</MagicCard>
		);

		expect(
			screen.getByText("Test Content")
		).toBeInTheDocument();
	});

	it("renders Shadcn Card with proper styling", () => {
		render(
			<Card className="test-class">
				<div>Card Content</div>
			</Card>
		);

		const card =
			screen.getByText("Card Content").parentElement;
		expect(card).toHaveClass("test-class");
	});
});
```

### Accessibility Testing

Create `__tests__/accessibility/navigation.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { FloatingNavbar } from "@/components/ui/aceternity";

expect.extend(toHaveNoViolations);

describe("Navigation Accessibility", () => {
	it("floating navbar has no accessibility violations", async () => {
		const { container } = render(
			<FloatingNavbar>
				<nav>
					<a href="/dashboard">Dashboard</a>
					<a href="/courses">Courses</a>
				</nav>
			</FloatingNavbar>
		);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("has correct ARIA labels", () => {
		render(
			<FloatingNavbar>
				<nav aria-label="Main navigation">
					<a href="/dashboard">Dashboard</a>
				</nav>
			</FloatingNavbar>
		);

		expect(screen.getByRole("navigation")).toHaveAttribute(
			"aria-label",
			"Main navigation"
		);
	});
});
```

## Next Steps

- Implement quiz interface with animated feedback using
  Aceternity's AnimatedNumber component
- Create assignment submission UI with Magic UI's
  DragAndDrop component
- Set up discussion forums with real-time animations using
  Aceternity's AnimatedChat
- Add notification system with Shadcn's Toast and Magic UI's
  PopIn animation
- Enhance course content viewer with Aceternity's
  PageTransition effects
