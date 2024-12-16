/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: [
    "./src/**/*.mdx",                    // Include MDX stories
    "./src/**/*.stories.@(js|jsx|ts|tsx)" // Include all story files
  ],
  addons: [
    "@storybook/preset-create-react-app",
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-mdx-gfm"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
};

export default config;
