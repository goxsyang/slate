// scratch test timeline
E.setProjection(d3.geoMercator().rotate([-130, 0]));
E.setCamera([{ t: 0, box: [-15, -15, 285 - 360 + 360, 68] }, { t: 3, box: [95, -5, 150, 45] }]);
E.fill('158', t => ({ color: '#e4c98f', opacity: 1 }));
E.lift('392', t => ({ color: '#a4c0d9', lift: 14 * E.seg(t, 3, 4), scale: 1 + 0.08 * E.seg(t, 3, 4), opacity: 1 }));
E.ruler({ center: [110, 15], rx: 22, ry: 18, color: '#354e99', t0: 1, t1: 3 });
E.arc({ from: [10, 50], to: [121, 23.7], color: '#1f6e5c', t0: 0.5, t1: 2.5, particles: 4, bulge: 0.2 });
E.pin({ at: [121, 23.7], color: '#996a0c', t0: 1, pulse: true });
E.card({ zh: '日本', en: 'Japan', color: '#354e99', at: [139.7, 35.7], t0: 2 });
E.bigCard({ title: 'ATFM', sub: '觀念與實務經驗', color: '#354e99', x: 120, y: 620, t0: 1, collapseAt: 4, collapseTo: [120, 900] });
E.poly({ coords: [[117.5, 29], [124, 29], [124, 23.5], [121.5, 21], [117.5, 21]], closed: true, color: '#996a0c', t0: 2, t1: 3.5, nodes: [[124, 25.5], [120, 21]] });
boot(17.4174);
