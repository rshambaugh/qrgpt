/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    "../src/**/*.mdx", // For MDX-based stories
    "../src/**/*.stories.@(js|jsx|ts|tsx)", // Matches all story files under src/
  ],
  addons: [
    "@storybook/preset-create-react-app",
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-mdx-gfm",
  ],
  framework: {
    name: "@storybook/react-vite", // Ensure this matches your project setup
    options: {},
  },
  staticDirs: ["../public"], // Serve static files
};
export default config;
