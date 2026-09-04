/* CopilotKit × agui 方案报告 —— mermaid 初始化与主题对齐 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var font = style.getPropertyValue('--font').trim();

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'strict',
    fontFamily: font,
    themeVariables: {
      primaryColor: '#ffffff',
      primaryTextColor: ink,
      primaryBorderColor: accent,
      lineColor: rule,
      secondaryColor: '#ffffff',
      tertiaryColor: '#ffffff',
      clusterBkg: '#eef1f6',
      clusterBorder: rule,
      textColor: ink,
      edgeLabelBackground: bg2,
      titleColor: muted,
      fontSize: '14px',
    },
  });

  function run() {
    try {
      mermaid.run();
    } catch (e) {
      console.error('mermaid render failed', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
