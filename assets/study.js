
        const CONSTANTES = {
            NOTAS: ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'],
            FALADOS_ACORDE: { 'C': 'Dó', 'C#/Db': 'Dó sustenido ou Ré bemol', 'D': 'Ré', 'D#/Eb': 'Ré sustenido ou Mi bemol', 'E': 'Mi', 'F': 'Fá', 'F#/Gb': 'Fá sustenido ou Sol bemol', 'G': 'Sol', 'G#/Ab': 'Sol sustenido ou Lá bemol', 'A': 'Lá', 'A#/Bb': 'Lá sustenido ou Si bemol', 'B': 'Si' },
            FALADOS_NOTAS: { 'C': 'Dó', 'C#/Db': 'Dó sustenido', 'D': 'Ré', 'D#/Eb': 'Ré sustenido', 'E': 'Mi', 'F': 'Fá', 'F#/Gb': 'Fá sustenido', 'G': 'Sol', 'G#/Ab': 'Sol sustenido', 'A': 'Lá', 'A#/Bb': 'Lá sustenido', 'B': 'Si' },
            ESCALA_MAIOR: [0, 2, 4, 5, 7, 9, 11],
            ESCALA_MENOR: [0, 2, 3, 5, 7, 8, 10],
            Q_CIFRA_MAIOR: ["", "m", "m", "", "", "m", "dim"],
            Q_CIFRA_MENOR: ["m", "dim", "", "m", "m", "", ""],
            Q_AUDIO_MAIOR: ["Maior", "Menor", "Menor", "Maior", "Maior", "Menor", "Diminuto"],
            Q_AUDIO_MENOR: ["Menor", "Diminuto", "Maior", "Menor", "Menor", "Maior", "Maior"],
            TABELA_SETIMAS: {
                Maior: { cifra: ['7M','m7','m7','7M','7','m7','m7b5'], audio: ['Sétima Maior', 'Sétima Menor', 'Sétima Menor', 'Sétima Maior', 'Dominante', 'Sétima Menor', 'Meio Diminuto'], offset: [11, 10, 10, 11, 10, 10, 10] },
                Menor: { cifra: ['m7','m7b5','7M','m7','m7','7M','7'], audio: ['Sétima Menor', 'Meio Diminuto', 'Sétima Maior', 'Sétima Menor', 'Sétima Menor', 'Sétima Maior', 'Dominante'], offset: [10, 10, 11, 10, 10, 11, 10] }
            },
            SEQ_TECLADO_LABELS: [ 'C', 'C#<br>Db', 'D', 'D#<br>Eb', 'E', 'F', 'F#<br>Gb', 'G', 'G#<br>Ab', 'A', 'A#<br>Bb', 'B', 'C', 'C#<br>Db', 'D', 'D#<br>Eb', 'E', 'F', 'F#<br>Gb', 'G', 'G#<br>Ab', 'A', 'A#<br>Bb', 'B' ],
            AFINA_CORDAS: [4, 11, 7, 2, 9, 4],
            ABS_TUNING: [16, 11, 7, 2, -3, -8],
            NOMES_CORDAS_VIOLAO: ['1 (e)', '2 (B)', '3 (G)', '4 (D)', '5 (A)', '6 (E)'],

            SHAPES_6: {
                "": [0, 0, 1, 2, 2, 0],
                "m": [0, 0, 0, 2, 2, 0],
                "dim": [null, null, 0, 2, 1, 0], // Contínuo: 6,5,4,3
                "7M": [0, 0, 1, 1, 2, 0], // Resolvido a quebra
                "m7": [0, 0, 0, 0, 2, 0], // Resolvido a quebra
                "7": [0, 0, 1, 0, 2, 0],  // Resolvido a quebra
                "m7b5": [null, null, 0, 0, 1, 0] // Sem quebra
            },
            SHAPES_5: { "": [null, 2, 2, 2, 0, null], "m": [0, 1, 2, 2, 0, null], "dim": [null, 1, 2, 1, 0, null], "7M": [null, 2, 1, 2, 0, null], "m7": [0, 1, 0, 2, 0, null], "7": [0, 2, 0, 2, 0, null], "m7b5": [null, 1, 0, 1, 0, null] },
            SHAPES_MINI_4: { "": [2, 3, 2, 0, null, null], "m": [1, 3, 2, 0, null, null], "dim": [1, 3, 1, 0, null, null], "7M": [2, 2, 2, 0, null, null], "m7": [1, 1, 2, 0, null, null], "7": [2, 1, 2, 0, null, null], "m7b5": [1, 1, 1, 0, null, null] },
            SHAPES_MINI_5: { "": [null, 2, 2, 2, 0, null], "m": [null, 1, 2, 2, 0, null], "dim": [null, 1, 2, 1, 0, null], "7M": [null, 2, 1, 2, 0, null], "m7": [null, 1, 0, 2, 0, null], "7": [null, 2, 0, 2, 0, null], "m7b5": [null, 1, 0, 1, 0, null] },
            SHAPES_MINI_6: { "": [null, null, 1, 2, 2, 0], "m": [null, null, 0, 2, 2, 0], "dim": [null, null, 0, 2, 1, 0], "7M": [null, null, 1, 1, 2, 0], "m7": [null, null, 0, 0, 2, 0], "7": [null, null, 1, 0, 2, 0], "m7b5": [null, null, 0, 0, 1, 0] }
        };

        const ESTADO = { ultimoGrauLivre: 0, rodando: false };

        let audioCtx; let mobileDesbloqueado = false;
        function hackearAudioMobile() {
            try {
                audioCtx = soundEngine.init(); mobileDesbloqueado = true;
                const status = document.getElementById('audio-status');
                if (status) status.textContent = 'Áudio pronto';
            } catch (error) {
                const status = document.getElementById('audio-status');
                if (status) status.textContent = error.message;
            }
        }
        function flashElemento(el, tipo) {
            if (!el) return;
            const name = tipo === 'piano' ? 'click-fx-piano' : 'click-fx-guitar';
            el.classList.add(name); setTimeout(() => el.classList.remove(name), 150);
        }
        function tocarTeclado(pitch, el) {
            hackearAudioMobile(); if (!audioCtx) return;
            flashElemento(el, 'piano'); soundEngine.note(pitch, 'piano');
        }
        function tocarViolao(pitch, el) {
            hackearAudioMobile(); if (!audioCtx) return;
            flashElemento(el, 'guitar'); soundEngine.note(pitch, 'guitar');
        }

        function renderizarTeclado() {
            let html = '';
            for (let i = 0; i <= 23; i++) {
                let isBlack = [1,3,6,8,10].includes(i%12);
                let classType = isBlack ? 'key-black' : 'key-white';
                let classPos = isBlack ? `pos-${CONSTANTES.NOTAS[i%12].replace(/#.*/,'').toLowerCase()}s${i<12?1:2}` : '';
                html += `<div class="${classType} ${classPos}" id="key-${i}" onclick="tocarTeclado(${i}, this)"><span class="piano-key-label">${CONSTANTES.SEQ_TECLADO_LABELS[i]}</span></div>`;
            }
            document.getElementById('piano-render').innerHTML = html;
        }

        function renderizarFretboard() {
            const casas = 12;
            const corda6Topo = document.getElementById("inverterCordas").value === "corda6";
            let renderOrder = corda6Topo ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];

            let html = '<div style="display: flex;">';
            html += '<div class="string-labels-col">';
            for (let i = 0; i < 6; i++) { let s = renderOrder[i]; html += `<div class="string-label" id="str-lbl-${s}">${CONSTANTES.NOMES_CORDAS_VIOLAO[s]}</div>`; }
            html += `<div class="string-label" style="height: 20px;"></div></div>`;

            html += '<div class="fretboard-container" style="flex: 1;">';
            html += `<div class="fret-dots"><div class="fret-dot-col nut-col"></div>`;
            for (let f = 1; f <= casas; f++) {
                if ([3, 5, 7, 9].includes(f)) { html += `<div class="fret-dot-col"><div class="dot"></div></div>`; }
                else if (f === 12) { html += `<div class="fret-dot-col"><div class="double-dot"><div class="dot"></div><div class="dot"></div></div></div>`; }
                else { html += `<div class="fret-dot-col"></div>`; }
            }
            html += `</div>`;

            for (let i = 0; i < 6; i++) {
                let s = renderOrder[i];
                html += `<div class="guitar-string"><div class="string-line"></div>`;
                for (let f = 0; f <= casas; f++) {
                    let notaIdx = (CONSTANTES.AFINA_CORDAS[s] + f) % 12;
                    let clsNut = f === 0 ? ' nut' : '';
                    let notaLetra = CONSTANTES.NOTAS[notaIdx].split('/')[0];
                    let absPitch = CONSTANTES.ABS_TUNING[s] + f;
                    html += `<div class="fret${clsNut}" data-fret="${f}"><div class="guitar-note" id="g-note-${s}-${f}" data-nota="${notaIdx}" onclick="tocarViolao(${absPitch}, this)">${notaLetra}</div></div>`;
                }
                html += `</div>`;
            }

            html += `<div class="fret-labels-row"><div class="fret-label nut-col" data-fret="0">0</div>`;
            for (let f = 1; f <= casas; f++) { html += `<div class="fret-label" data-fret="${f}">${f}</div>`; }
            html += `</div></div></div>`;

            document.getElementById('fretboard-render').innerHTML = html;
            atualizarCapotraste();
        }

        function aoInverterCordas() { renderizarFretboard(); aoMudarConfigGlobal(); }

        function mudarAba(idAba, elementoBotao) {
            if (elementoBotao.disabled) return;
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(aba => aba.classList.remove('active'));
            elementoBotao.classList.add('active'); document.getElementById(`aba-${idAba}`).classList.add('active');

            const selectSetima = document.getElementById("tipoSetima"); const optAmbas = document.getElementById("opt-setima-ambas");
            if (idAba === "paraiso") { optAmbas.style.display = "none"; if (selectSetima.value === "ambas") selectSetima.value = "diatonica"; }
            else { optAmbas.style.display = "block"; }
            aoMudarConfigGlobal();
        }

        window.onload = function() {
            renderizarTeclado();
            renderizarFretboard();
            atualizarInterface();
            atualizarBotoesLivres();
        };

        function atualizarInterface() {
            const modo = document.getElementById("modoRng").value;
            document.getElementById("painelFocado").style.display = (modo === "focado") ? "block" : "none";

            const inst = document.getElementById("instVisual").value;
            document.getElementById("wrapper-piano").style.display = (inst === "ambos" || inst === "teclado") ? "block" : "none";
            document.getElementById("wrapper-violao").style.display = (inst === "ambos" || inst === "violao") ? "block" : "none";
            document.getElementById("painelInversao").style.display = (inst === "ambos" || inst === "teclado") ? "block" : "none";
            document.getElementById("painelViolao").style.display = (inst === "ambos" || inst === "violao") ? "block" : "none";

            const formAcorde = document.getElementById("formatoAcorde").value;
            if (formAcorde === "tetrade") {
                document.getElementById("painelRegraSetima").style.display = "block";
                document.getElementById("opt-inv3").style.display = "block";
            } else {
                document.getElementById("painelRegraSetima").style.display = "none";
                document.getElementById("opt-inv3").style.display = "none";
                if(document.getElementById("inversaoTeclado").value === "3") document.getElementById("inversaoTeclado").value = "0";
            }
        }

        function atualizarCapotraste() {
            const capoValue = parseInt(document.getElementById("capotraste").value);
            document.querySelectorAll('.fret, .fret-label').forEach(el => {
                let fNum = parseInt(el.getAttribute('data-fret'));
                if (fNum < capoValue) { el.classList.add('blocked'); el.classList.remove('has-capo'); }
                else if (fNum === capoValue && capoValue > 0) { el.classList.remove('blocked'); el.classList.add('has-capo'); }
                else { el.classList.remove('blocked', 'has-capo'); }
            });
        }

        function atualizarBotoesLivres() {
            const tomBase = document.getElementById("tomFixo").value; const escalaBase = document.getElementById("escalaFixa").value;
            const formAcorde = document.getElementById("formatoAcorde").value === "tetrade"; let tipoSetima = document.getElementById("tipoSetima").value;
            if (tipoSetima === "ambas") tipoSetima = "diatonica";

            let campoMagico = gerarCampoHarmonico(tomBase, escalaBase, 0, formAcorde, tipoSetima);
            for(let i=1; i<=7; i++) {
                let txtElement = document.getElementById("btn-grau-" + i + "-cifra");
                let btnElement = document.getElementById("btn-grau-" + i);
                if(txtElement && btnElement && campoMagico[i]) {
                    let qCifra = campoMagico[i].qCifra;
                    let cifraBase = campoMagico[i].visual.split(" (")[0];
                    txtElement.innerText = `(${cifraBase})`;

                    btnElement.classList.remove('btn-maior', 'btn-menor', 'btn-dim');
                    if (["", "7M", "7"].includes(qCifra)) { btnElement.classList.add('btn-maior'); }
                    else if (["m", "m7"].includes(qCifra)) { btnElement.classList.add('btn-menor'); }
                    else { btnElement.classList.add('btn-dim'); }
                }
            }
        }

        function printLog(texto) {
            const consoleLog = document.getElementById('console-log');
            consoleLog.innerHTML += `<span class="line">> ${texto}</span>`;
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }

        function limparHighlights() {
            for (let i = 0; i <= 23; i++) { document.getElementById(`key-${i}`).classList.remove('active', 'root-active', 'seventh-active'); }
            document.querySelectorAll('.guitar-note').forEach(el => el.classList.remove('active', 'root-active', 'seventh-active'));
            document.querySelectorAll('.fret').forEach(el => el.classList.remove('fret-pestana', 'pestana-top', 'pestana-bottom'));
            for(let s=0; s<6; s++) { document.getElementById('str-lbl-'+s).innerHTML = CONSTANTES.NOMES_CORDAS_VIOLAO[s]; }
        }

        function acenderTeclado(arrayIndices, rootValue, seventhValue) {
            arrayIndices.forEach(idx => {
                let el = document.getElementById(`key-${idx}`);
                if (!el) return;
                if (idx === rootValue) { el.classList.add('root-active'); }
                else if (seventhValue !== null && idx === seventhValue) { el.classList.add('seventh-active'); }
                else { el.classList.add('active'); }
            });
        }

        function acenderViolao(arrayIndices, rootValue, seventhValue, qCifra) {
            let rootBase = rootValue % 12; let seventhBase = seventhValue !== null ? seventhValue % 12 : null;
            let otherBases = arrayIndices.map(x => x % 12).filter(x => x !== rootBase && x !== seventhBase);
            let capoValue = parseInt(document.getElementById("capotraste").value);
            let modoViolao = document.getElementById("modoViolao").value;
            let playedPitches = [];

            if (modoViolao === "shape" || modoViolao === "mini") {
                let rootFret4 = -1, rootFret5 = -1, rootFret6 = -1;
                for (let f = capoValue; f <= 12; f++) {
                    if (rootFret6 === -1 && (4 + f) % 12 === rootBase) rootFret6 = f;
                    if (rootFret5 === -1 && (9 + f) % 12 === rootBase) rootFret5 = f;
                    if (rootFret4 === -1 && (2 + f) % 12 === rootBase) rootFret4 = f;
                }

                let shapeArr = null; let baseFret = -1;

                if (modoViolao === "mini") {
                    let candidates = [];
                    if (rootFret6 !== -1 && CONSTANTES.SHAPES_MINI_6[qCifra]) candidates.push({f: rootFret6, s: CONSTANTES.SHAPES_MINI_6[qCifra]});
                    if (rootFret4 !== -1 && CONSTANTES.SHAPES_MINI_4[qCifra]) candidates.push({f: rootFret4, s: CONSTANTES.SHAPES_MINI_4[qCifra]});
                    candidates.sort((a, b) => a.f - b.f);
                    if(candidates.length > 0) { baseFret = candidates[0].f; shapeArr = candidates[0].s; }
                } else {
                    let candidates = [];
                    if (rootFret6 !== -1 && CONSTANTES.SHAPES_6[qCifra]) candidates.push({f: rootFret6, s: CONSTANTES.SHAPES_6[qCifra]});
                    if (rootFret5 !== -1 && CONSTANTES.SHAPES_5[qCifra]) candidates.push({f: rootFret5, s: CONSTANTES.SHAPES_5[qCifra]});

                    candidates.sort((a, b) => a.f - b.f);
                    if(candidates.length > 0) { baseFret = candidates[0].f; shapeArr = candidates[0].s; }
                }

                let shapeNotes = [];
                if (shapeArr) {
                    for (let s = 0; s < 6; s++) {
                        let offset = shapeArr[s];
                        if (offset !== null) {
                            let targetFret = baseFret + offset;
                            if (targetFret >= capoValue && targetFret <= 12) {
                                shapeNotes.push({ string: s, fret: targetFret });
                                let absPitch = CONSTANTES.ABS_TUNING[s] + targetFret;
                                playedPitches.push(absPitch);

                                let el = document.getElementById(`g-note-${s}-${targetFret}`);
                                if (el) {
                                    let nIdx = parseInt(el.getAttribute('data-nota'));
                                    if (nIdx === rootBase) el.classList.add('root-active');
                                    else if (seventhBase !== null && nIdx === seventhBase) el.classList.add('seventh-active');
                                    else el.classList.add('active');
                                }
                            }
                        } else {
                            document.getElementById('str-lbl-'+s).innerHTML = CONSTANTES.NOMES_CORDAS_VIOLAO[s] + ' <span class="mute-x">[X]</span>';
                        }
                    }

                    if (modoViolao === "shape" && shapeNotes.length > 0) {
                        let activeFrets = shapeNotes.map(n => n.fret).filter(f => f > capoValue);
                        if (activeFrets.length > 0) {
                            let minFret = Math.min(...activeFrets);
                            let notesOnMinFret = shapeNotes.filter(n => n.fret === minFret);
                            let activeStringsOnMinFret = notesOnMinFret.map(n => n.string);

                            if (activeStringsOnMinFret.includes(0)) {
                                let maxStrOnMinFret = Math.max(...activeStringsOnMinFret);
                                if (maxStrOnMinFret >= 4) {
                                    const corda6Topo = document.getElementById("inverterCordas").value === "corda6";
                                    let renderOrder = corda6Topo ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];

                                    for(let s = 0; s <= maxStrOnMinFret; s++) {
                                        let fretEl = document.getElementById(`g-note-${s}-${minFret}`);
                                        if(fretEl) {
                                            let parentFret = fretEl.parentElement; parentFret.classList.add('fret-pestana');
                                            let visualIndex = renderOrder.indexOf(s);
                                            let minVisIdx = Math.min(...Array.from({length: maxStrOnMinFret + 1}, (_, i) => renderOrder.indexOf(i)));
                                            let maxVisIdx = Math.max(...Array.from({length: maxStrOnMinFret + 1}, (_, i) => renderOrder.indexOf(i)));

                                            if (visualIndex === minVisIdx) parentFret.classList.add('pestana-top');
                                            if (visualIndex === maxVisIdx) parentFret.classList.add('pestana-bottom');
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else { renderizarAoE(rootBase, seventhBase, otherBases, capoValue); }
            } else { renderizarAoE(rootBase, seventhBase, otherBases, capoValue); }

            return playedPitches;
        }

        function renderizarAoE(rootBase, seventhBase, otherBases, capoValue) {
            document.querySelectorAll('.guitar-note').forEach(el => {
                let idParts = el.id.split('-'); let nFret = parseInt(idParts[3]);
                if (nFret < capoValue) return;
                let nIdx = parseInt(el.getAttribute('data-nota'));
                if (nIdx === rootBase) el.classList.add('root-active');
                else if (seventhBase !== null && nIdx === seventhBase) el.classList.add('seventh-active');
                else if (otherBases.includes(nIdx)) el.classList.add('active');
            });
        }

        function aoMudarConfigGlobal() {
            atualizarInterface(); atualizarCapotraste(); atualizarBotoesLivres();
            const isParaiso = document.getElementById('aba-paraiso').classList.contains('active');
            if (isParaiso && ESTADO.ultimoGrauLivre > 0 && !ESTADO.rodando) { dispararGrauLivre(ESTADO.ultimoGrauLivre, true); }
        }

        function ativarEIniciar() { if (!mobileDesbloqueado) hackearAudioMobile(); iniciarTreino(); }

        async function bipar(tipo) {
            try {
                const modoSom = document.getElementById("somTick").value;
                if (modoSom === "voz") {
                    const synth = window.speechSynthesis; const utterThis = new SpeechSynthesisUtterance(tipo === "forte" ? "Pí" : "Pá");
                    utterThis.lang = 'pt-BR'; utterThis.rate = 2.0; utterThis.volume = 1.0;
                    utterThis.onend = () => {}; utterThis.onerror = () => {}; synth.speak(utterThis);
                } else {
                    if (!audioCtx) return; if (audioCtx.state === 'suspended') { audioCtx.resume(); }
                    const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
                    if (modoSom === "mec") {
                        oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(tipo === "forte" ? 1200 : 800, audioCtx.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05); gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); oscillator.connect(gainNode); gainNode.connect(soundEngine.master);
                        oscillator.start(audioCtx.currentTime); oscillator.stop(audioCtx.currentTime + 0.05);
                    } else {
                        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(tipo === "forte" ? 800 : 400, audioCtx.currentTime);
                        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                        oscillator.connect(gainNode); gainNode.connect(soundEngine.master); oscillator.start(audioCtx.currentTime); oscillator.stop(audioCtx.currentTime + 0.1);
                    }
                }
                const hud = document.getElementById("hudMain");
                if (tipo === "forte") { hud.style.borderColor = "var(--neon-magenta)"; hud.style.boxShadow = "0 0 30px var(--neon-magenta)"; }
                else { hud.style.borderColor = "#ffffff"; hud.style.boxShadow = "0 0 20px #ffffff"; }
                setTimeout(() => { hud.style.borderColor = "var(--neon-ciano)"; hud.style.boxShadow = "0 0 20px rgba(0, 255, 204, 0.5), inset 0 0 10px rgba(0, 255, 204, 0.2)"; }, 100);
            } catch (err) { console.error("[bipar]", err); }
        }

        function falar(texto, velocidade = 1.3) {
            return new Promise(resolve => {
                try {
                    const synth = window.speechSynthesis; const utterThis = new SpeechSynthesisUtterance(texto);
                    utterThis.lang = 'pt-BR'; utterThis.rate = velocidade; utterThis.volume = 1.0;
                    let resolvido = false; const safeResolve = () => { if (!resolvido) { resolvido = true; resolve(); } };
                    utterThis.onend = safeResolve; utterThis.onerror = safeResolve;

                    let checkInterval = setInterval(() => { if (!synth.speaking) { clearInterval(checkInterval); safeResolve(); } }, 500);
                    setTimeout(() => { clearInterval(checkInterval); safeResolve(); }, 10000);
                    synth.speak(utterThis);
                } catch(e) { resolve(); }
            });
        }

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        class SacoDeGraus {
            constructor() { this.saco = []; }
            puxarGrau() {
                if (this.saco.length === 0) { this.saco = [1, 2, 3, 4, 5, 6, 7]; for (let i = this.saco.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.saco[i], this.saco[j]] = [this.saco[j], this.saco[i]]; } }
                return this.saco.pop();
            }
        }

        function formatarCifraAcordeCompleta(nota_cifra, qualidade_cifra) { return nota_cifra.split("/").map(p => p + qualidade_cifra).join("/"); }
        function formatarNomeAcordeCompleto(nota_cifra, qualidade_audio) { let nome_base = CONSTANTES.FALADOS_ACORDE[nota_cifra] || MusicTheory.label(nota_cifra, 'solfege'); return nome_base.split(" ou ").map(p => p + " " + qualidade_audio).join(" ou "); }

        function gerarCampoHarmonico(raiz, modo, inversao, usarSetima, tipoSetimaManual) {
            let campo = {}; let idx_raiz = CONSTANTES.NOTAS.indexOf(raiz);
            let intervalos = modo === "Maior" ? CONSTANTES.ESCALA_MAIOR : CONSTANTES.ESCALA_MENOR;

            for (let i = 0; i < 7; i++) {
                let idx_nota_atual = (idx_raiz + intervalos[i]) % 12; let nota_cifra = CONSTANTES.NOTAS[idx_nota_atual];
                let terca, quinta, setima = null;
                let q_cifra = modo === "Maior" ? CONSTANTES.Q_CIFRA_MAIOR[i] : CONSTANTES.Q_CIFRA_MENOR[i];
                let q_audio = modo === "Maior" ? CONSTANTES.Q_AUDIO_MAIOR[i] : CONSTANTES.Q_AUDIO_MENOR[i];

                if (q_cifra === "") { terca = 4; quinta = 7; }
                else if (q_cifra === "m") { terca = 3; quinta = 7; }
                else if (q_cifra === "dim") { terca = 3; quinta = 6; }

                let regraAtual = tipoSetimaManual;
                if (usarSetima && regraAtual === "ambas") { regraAtual = Math.random() > 0.5 ? "maior" : "menor"; }

                if (usarSetima) {
                    if (regraAtual === "diatonica") {
                        q_cifra = CONSTANTES.TABELA_SETIMAS[modo].cifra[i];
                        q_audio = CONSTANTES.TABELA_SETIMAS[modo].audio[i];
                        setima = CONSTANTES.TABELA_SETIMAS[modo].offset[i];
                    } else if (regraAtual === "maior") { setima = 11; q_cifra += "7M"; q_audio += " com sétima maior"; }
                    else if (regraAtual === "menor") {
                        if (q_cifra === "dim") { setima = 10; q_cifra = "m7b5"; q_audio = "Meio Diminuto"; } else { setima = 10; q_cifra += "7"; q_audio += " com sétima menor"; }
                    }
                }

                let arr = [];
                if (!usarSetima) {
                    if (inversao === 0) { arr = [idx_nota_atual, idx_nota_atual + terca, idx_nota_atual + quinta]; }
                    else if (inversao === 1) { arr = [idx_nota_atual + terca, idx_nota_atual + quinta, idx_nota_atual + 12]; }
                    else if (inversao === 2) { arr = [idx_nota_atual + quinta, idx_nota_atual + 12, idx_nota_atual + terca + 12]; }
                } else {
                    if (inversao === 0) { arr = [idx_nota_atual, idx_nota_atual + terca, idx_nota_atual + quinta, idx_nota_atual + setima]; }
                    else if (inversao === 1) { arr = [idx_nota_atual + terca, idx_nota_atual + quinta, idx_nota_atual + setima, idx_nota_atual + 12]; }
                    else if (inversao === 2) { arr = [idx_nota_atual + quinta, idx_nota_atual + setima, idx_nota_atual + 12, idx_nota_atual + terca + 12]; }
                    else if (inversao === 3) { arr = [idx_nota_atual + setima, idx_nota_atual + 12, idx_nota_atual + terca + 12, idx_nota_atual + quinta + 12]; }
                }

                while (Math.max(...arr) > 23) { arr = arr.map(val => val - 12); }
                const spelling = MusicTheory.scale(idx_raiz, modo);
                const contextualName = pc => spelling.find(n => n.pc === MusicTheory.mod(pc))?.name || CONSTANTES.NOTAS[MusicTheory.mod(pc)].split('/')[0];
                if (!usarSetima || regraAtual === 'diatonica') nota_cifra = spelling[i].name;
                let textoNotasDic = arr.map(val => MusicTheory.label(contextualName(val), 'solfege')).join(", ").replace(/,([^,]*)$/, ' e$1');

                let rootTarget = arr.find(val => val % 12 === idx_nota_atual);
                let seventhTarget = usarSetima ? arr.find(val => val % 12 === (idx_nota_atual + setima) % 12) : null;

                campo[i+1] = {
                    visual: `${formatarCifraAcordeCompleta(nota_cifra, q_cifra)} (${formatarNomeAcordeCompleto(nota_cifra, q_audio)})`,
                    visualCifra: formatarCifraAcordeCompleta(nota_cifra, q_cifra),
                    qCifra: q_cifra, audio: formatarNomeAcordeCompleto(nota_cifra, q_audio),
                    notasFinais: textoNotasDic, indicesHitbox: arr, rootHitbox: rootTarget, seventhHitbox: seventhTarget
                };
            }
            return campo;
        }

        function travarUI(estado) {
            document.querySelectorAll('.tab-btn').forEach(b => b.disabled = estado); document.querySelectorAll('.free-roam-btn').forEach(b => b.disabled = estado);
            document.getElementById("btnStart").disabled = estado; document.getElementById("btnStart").innerText = estado ? "SESSÃO EM ANDAMENTO..." : "INICIAR DESAFIO";
        }
