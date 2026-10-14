async function checkBgTitle() {
  const cRes = await fetch('https://visafornation.com/assets/css/style.css');
  const cText = await cRes.text();
  const m1 = cText.match(/\.bg-title\b[\s\S]{0,200}/i);
  console.log('bg-title:', m1 ? m1[0] : 'not found');
  const m2 = cText.match(/\.footer-layout2\b[\s\S]{0,300}/i);
  console.log('footer-layout2:', m2 ? m2[0] : 'not found');
}
checkBgTitle();
