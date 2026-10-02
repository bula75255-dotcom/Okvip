// ==UserScript==
// @name         labubu36 okvip
// @namespace    https://example.local/
// @version      9.9.0
// @description  labubu36 okvip - Tự điền form, giải Captcha Icon & Slider, Bank, VIOTP, Gửi Tele khi ấn Xác nhận Bank
// @match        *://*/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      omocaptcha.com
// @connect      botion.com
// @connect      static.botion.com
// @connect      api.viotp.com
// @connect      api.telegram.org
// @connect      *
// @run-at       document-end
// ==/UserScript==

(() => {
    'use strict';

    const SITES = [
        { id: 'C168',  name: 'C168',  url: 'https://m.c168a8.cc/home/register?id=100060281' },
        { id: 'SC88',  name: 'SC88',  url: 'https://sc88vc.top/home/register?id=630910578' },
        { id: 'CM88',  name: 'CM88',  url: 'https://cm88a.com?id=713371007&fixed.iswebclip=2' }
    ];

    const BANK_LIST = [
        "MB BANK", "Vietcom Bank", "Vietin Bank(VTB)", "TECHCOMBANK(TCB)", "BIDV",
        "ACB", "TPBank", "AGRIBANK", "VPBANK", "VIB", "SHB", "HDBank", "OCB",
        "SACOMBANK(STB)", "MSB", "Vikki Bank", "CAKE", "LIO Bank", "TIMO BANK",
        "NCB", "LIENVIETPOSTBANK(LPB)", "Nam A BANK", "CIMB", "HONG LEONG BANK (HLBVN)",
        "BACABANK(BAB)", "BVBank", "OCEAN BANK", "ABBANK(ABB)", "IBK-HN(IBK)",
        "DONGABANK (DAB/EAB)", "NGAN HANG HOP TAC(Co-opBank)", "VIET BANK", "IVB",
        "ShinhanBank", "BAOVIETBANK", "PG BANK", "SeABank", "Housing Bank", "VDB",
        "Other Bank", "NH Bank", "AmBank", "HSBC(HSCB VIETNAM)", "KB Kookmin Bank",
        "PVcom  Bank", "DBS-HCM(DBS)", "CB", "SBV", "MBV", "Woori Bank", "VRB",
        "UBANK BY VP BANK(UBANK)", "MARITIMEBANK(MSB)", "STANCHART(SCVN)", "VBSP",
        "KIENLONGBANK(KLB)", "VIET A BANK(VAB)", "EXIMBANK(EIB)", "PUBLICBANKVIETNAM",
        "GPBANK", "SCB BANK(SCB)", "United Overseas bank(UOB)", "SAIGONBANK(SGB)",
        "Kasikornbank", "North American Savings Bank"
    ];

    const DEFAULT_API_KEY = "OMO_GV4UKFN31GBHRLRIGQZW5M1HDL8SMQWMGRHI0GT5JYK5OJJMLENZLNUBTNNIMU1790903992";
    const DEFAULT_VIOTP_TOKEN = "ed92a9e2c841433cb86f40bdb6256027";

    // Cấu hình Telegram mới của bạn
    const TELEGRAM_CONFIG = {
        token: "8532560878:AAGyWDmsiNdLARIhhaHRYYCDAO06rjX5W0k",
        chatId: "6131275548"
    };

    let isScriptStopped = GM_getValue('ice_script_stopped', false);

    function getApiKey() {
        const storedKey = GM_getValue('omocaptcha_api_key', '');
        if (!storedKey || storedKey.trim() === '') {
            return DEFAULT_API_KEY;
        }
        return storedKey;
    }

    function getViotpToken() {
        const storedToken = GM_getValue('viotp_token', '');
        if (!storedToken || storedToken.trim() === '') {
            return DEFAULT_VIOTP_TOKEN;
        }
        return storedToken;
    }

    function isTarget3Web() {
        const host = window.location.hostname.toLowerCase();
        return host.includes('c168') || host.includes('sc88') || host.includes('cm88');
    }

    // --- HỆ THỐNG GHI LOG UI ---
    function logToUI(message, type = 'info') {
        const consoleContent = document.getElementById('ice-console-content');
        if (!consoleContent) return;

        const timeStr = new Date().toLocaleTimeString();
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warn: '#f39c12',
            error: '#e74c3c'
        };

        const item = document.createElement('div');
        item.style.cssText = `margin-bottom: 3px; word-break: break-all; border-left: 2px solid ${colors[type] || '#3498db'}; padding-left: 5px;`;
        item.innerHTML = `<span style="color:#8dafc0; font-size:9px;">[${timeStr}]</span> ${message}`;
        
        consoleContent.appendChild(item);
        consoleContent.scrollTop = consoleContent.scrollHeight;

        while (consoleContent.children.length > 50) {
            consoleContent.removeChild(consoleContent.firstChild);
        }
    }

    // ==========================================
    // MODULE GỬI THÔNG TIN VỀ TELEGRAM
    // ==========================================
    function sendTelegramNotification(customData = {}) {
        const username = customData.username || GM_getValue('last_generated_account', 'N/A');
        const password = customData.password || 'Tanthu123@';
        const withdrawPass = customData.withdrawPass || '111112';
        const phone = customData.phone || GM_getValue('auto_fill_phone', 'N/A');
        const siteName = window.location.hostname;

        const sentKey = `sent_tele_bank_${siteName}_${username}`;
        if (GM_getValue(sentKey, false)) return;
        GM_setValue(sentKey, true);

        const message = `🎉 *ĐÃ LIÊN KẾT BANK & HOÀN TẤT!*\n\n` +
                        `🌐 *Trang web:* ${siteName}\n` +
                        `👤 *Tên acc:* \`${username}\`\n` +
                        `🔑 *Mật khẩu:* \`${password}\`\n` +
                        `💸 *MK rút:* \`${withdrawPass}\`\n` +
                        `📱 *SĐT:* \`${phone}\``;

        const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.token}/sendMessage`;
        
        GM_xmlhttpRequest({
            method: "POST",
            url: url,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.chatId,
                text: message,
                parse_mode: "Markdown"
            }),
            onload: function(res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.ok) {
                        logToUI(`Đã gửi full thông tin tài khoản ${username} về Telegram thành công!`, 'success');
                    } else {
                        logToUI(`Lỗi Telegram: ${data.description}`, 'error');
                    }
                } catch (e) {
                    logToUI('Lỗi parse phản hồi từ Telegram', 'error');
                }
            },
            onerror: function() {
                logToUI('Không thể kết nối tới API Telegram', 'error');
            }
        });
    }

    // ==========================================
    // MODULE VIOTP (ĐÃ ĐƯA LÊN ĐÂY ĐỂ TRÁNH LỖI KHÔNG TÌM THẤY HÀM)
    // ==========================================
    function viotpGetServices(token) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.viotp.com/service/getv2?token=${encodeURIComponent(token)}&country=vn`,
                headers: { "Accept": "application/json" },
                onload: function (res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (data.status_code === 200 && Array.isArray(data.data)) {
                            resolve(data.data);
                        } else {
                            reject(new Error(data.message || 'Lỗi lấy dịch vụ VIOTP'));
                        }
                    } catch (e) {
                        reject(new Error('Lỗi parse JSON DV VIOTP'));
                    }
                },
                onerror: () => reject(new Error('Mất kết nối VIOTP'))
            });
        });
    }

    function viotpRequestPhone(token, serviceId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.viotp.com/request/getv2?token=${encodeURIComponent(token)}&serviceId=${encodeURIComponent(serviceId)}`,
                headers: { "Accept": "application/json" },
                onload: function (res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (data.status_code === 200 && data.data) {
                            resolve(data.data);
                        } else {
                            reject(new Error(data.message || 'Lỗi thuê số hoặc hết số'));
                        }
                    } catch (e) {
                        reject(new Error('Lỗi parse JSON thuê số'));
                    }
                },
                onerror: () => reject(new Error('Mất kết nối API thuê số'))
            });
        });
    }

    function viotpCheckCode(token, requestId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.viotp.com/session/getv2?requestId=${encodeURIComponent(requestId)}&token=${encodeURIComponent(token)}`,
                headers: { "Accept": "application/json" },
                onload: function (res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (data.status_code === 200 && data.data) {
                            resolve(data.data);
                        } else {
                            reject(new Error(data.message || 'Chưa có code'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: reject
            });
        });
    }

    let otpPollingInterval = null;
    function startListeningOtp(token, requestId) {
        if (otpPollingInterval) clearInterval(otpPollingInterval);

        const otpDisplay = document.getElementById('ice-inp-otp-display');
        if (otpDisplay) {
            otpDisplay.value = 'Đang đợi OTP...';
            otpDisplay.style.color = '#f39c12';
        }

        let attempts = 0;
        const maxAttempts = 75;

        otpPollingInterval = setInterval(async () => {
            if (isScriptStopped) {
                clearInterval(otpPollingInterval);
                if (otpDisplay) {
                    otpDisplay.value = 'Đã dừng kiểm tra';
                    otpDisplay.style.color = '#7f8c8d';
                }
                return;
            }

            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(otpPollingInterval);
                if (otpDisplay) {
                    otpDisplay.value = 'Hết thời gian chờ OTP';
                    otpDisplay.style.color = '#e74c3c';
                }
                logToUI('Đã dừng chờ OTP do quá thời gian.', 'warn');
                return;
            }

            try {
                const sessionData = await viotpCheckCode(token, requestId);
                if (sessionData.Status === 1 || sessionData.Code) {
                    clearInterval(otpPollingInterval);
                    const otpCode = sessionData.Code || '';
                    if (otpDisplay) {
                        otpDisplay.value = otpCode;
                        otpDisplay.style.color = '#2ecc71';
                    }
                    logToUI(`NHẬN ĐƯỢC OTP THÀNH CÔNG: [ ${otpCode} ]`, 'success');
                } else if (sessionData.Status === 2) {
                    clearInterval(otpPollingInterval);
                    if (otpDisplay) {
                        otpDisplay.value = 'Số đã hết hạn';
                        otpDisplay.style.color = '#e74c3c';
                    }
                    logToUI('Yêu cầu thuê số đã hết hạn.', 'error');
                }
            } catch (e) {}
        }, 2000);
    }

    // ==========================================
    // CÁC HÀM MÔ PHỎNG SỰ KIỆN CHUỘT / CHẠM
    // ==========================================
    function forceClick(target) {
        if (!target) return;
        if (target.hasAttribute('disabled')) target.removeAttribute('disabled');
        if (target.classList.contains('disabled')) target.classList.remove('disabled');

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const rect = target.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        try {
            const touchObj = new Touch({
                identifier: Date.now(),
                target: target,
                clientX: clientX,
                clientY: clientY,
                radiusX: 2.5,
                radiusY: 2.5,
                force: 0.5,
            });
            target.dispatchEvent(new TouchEvent('touchstart', { touches: [touchObj], targetTouches: [touchObj], changedTouches: [touchObj], bubbles: true, cancelable: true }));
            target.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [touchObj], bubbles: true, cancelable: true }));
        } catch (e) {}

        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
            target.dispatchEvent(new MouseEvent(type, { view: window, bubbles: true, cancelable: true, clientX: clientX, clientY: clientY, buttons: 1 }));
        });

        if (typeof target.click === 'function') target.click();
    }

    function setNativeValue(element, value) {
        if (!element || value === undefined || value === null) return;
        element.focus();
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else {
            element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async function humanTypeCharByChar(inputEl, textToType) {
        if (!inputEl) return;
        const cleanNumber = String(textToType).replace(/\D/g, '');

        inputEl.focus();
        setNativeValue(inputEl, '');
        await new Promise(r => setTimeout(r, 60));

        let currentVal = '';
        for (let i = 0; i < cleanNumber.length; i++) {
            if (isScriptStopped) return;
            const char = cleanNumber[i];
            currentVal += char;

            inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Digit${char}`, keyCode: 48 + parseInt(char), which: 48 + parseInt(char), bubbles: true }));
            inputEl.dispatchEvent(new KeyboardEvent('keypress', { key: char, code: `Digit${char}`, keyCode: char.charCodeAt(0), which: char.charCodeAt(0), bubbles: true }));

            setNativeValue(inputEl, currentVal);

            inputEl.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));
            inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: `Digit${char}`, keyCode: 48 + parseInt(char), which: 48 + parseInt(char), bubbles: true }));

            await new Promise(r => setTimeout(r, 45 + Math.floor(Math.random() * 25)));
        }

        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.blur();
    }

    // ==========================================
    // 1. LUỒNG TỰ ĐỘNG SAU KHI ĐĂNG KÝ (BANK & SĐT)
    // ==========================================
    let stepAccountClicked = false;
    let stepWithdrawClicked = false;
    let stepPasswordDone = false;
    let stepAddAccountClicked = false;
    let stepBankCardClicked = false;
    let stepReInputPassDone = false;
    let stepSelectBankDone = false;
    let stepInputBankNoDone = false;
    let stepConfirmBankDone = false;
    let isBusy = false;

    function getKeyboardContainer() {
        const candidateContainers = document.querySelectorAll(
            '.ui-number-keyboard, .van-number-keyboard, [class*="number-keyboard"], [class*="Keyboard"], [class*="keyboard"]'
        );
        for (let c of candidateContainers) {
            const rect = c.getBoundingClientRect();
            if (rect.height > 100 && rect.top > window.innerHeight * 0.3) {
                return c;
            }
        }
        const allDivs = document.querySelectorAll('div');
        for (let d of allDivs) {
            const rect = d.getBoundingClientRect();
            if (rect.top > window.innerHeight * 0.35 && rect.height > 120 && rect.width > 200) {
                const txt = d.textContent;
                if (txt.includes('1') && txt.includes('2') && txt.includes('3') && txt.includes('0')) {
                    return d;
                }
            }
        }
        return null;
    }

    function findKeyInKeyboard(numChar) {
        const charStr = String(numChar).trim();
        const kb = getKeyboardContainer();
        if (!kb) return null;

        const elements = kb.querySelectorAll('*');
        for (let el of elements) {
            if (el.textContent.trim() === charStr && el.children.length === 0) {
                return el;
            }
        }
        for (let el of elements) {
            if (el.textContent.trim() === charStr && el.children.length <= 1) {
                return el;
            }
        }
        return null;
    }

    async function pressVantKey(numChar) {
        const keyEl = findKeyInKeyboard(numChar);
        if (!keyEl) return false;

        const rect = keyEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const target = keyEl.closest('[role="button"]') || keyEl;

        const isTouchSupported = 'ontouchstart' in window;
        if (isTouchSupported) {
            try {
                const touchObj = new Touch({ identifier: Date.now(), target: target, clientX: cx, clientY: cy, pageX: cx, pageY: cy, radiusX: 2.5, radiusY: 2.5, force: 0.5 });
                target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, view: window, touches: [touchObj], targetTouches: [touchObj], changedTouches: [touchObj] }));
                await new Promise(r => setTimeout(r, 60));
                target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, view: window, touches: [], targetTouches: [], changedTouches: [touchObj] }));
            } catch (e) {}
        } else {
            target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, buttons: 1 }));
            await new Promise(r => setTimeout(r, 60));
            target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, buttons: 1 }));
            target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, buttons: 1 }));
        }

        if (typeof target.click === 'function') target.click();
        await new Promise(r => setTimeout(r, 160));
        return true;
    }

    async function type111112() {
        for (let char of '111112') {
            if (isScriptStopped) return;
            await pressVantKey(char);
            await new Promise(r => setTimeout(r, 80));
        }
    }

    async function handlePostRegisterWorkflow() {
        if (isScriptStopped || !isTarget3Web() || isBusy) return;
        if (stepConfirmBankDone) return;

        isBusy = true;
        try {
            if (!stepAccountClicked) {
                const host = window.location.hostname.toLowerCase();
                const keyword = host.includes('cm88') ? 'Tài Khoản' : 'Tôi';
                const foundNode = Array.from(document.querySelectorAll('*')).find(e => e.textContent.trim() === keyword && e.children.length === 0);
                const targetElement = (foundNode?.closest('a, button, div, span') || foundNode);

                if (targetElement) {
                    stepAccountClicked = true;
                    logToUI('Đang thao tác mục tài khoản...', 'info');
                    forceClick(targetElement);
                    return;
                }
            }

            if (stepAccountClicked && !stepWithdrawClicked) {
                const docs = [document, ...Array.from(document.querySelectorAll('iframe')).map(f => {try {return f.contentDocument} catch(e) {}})];
                let foundWithdraw = false;

                for (const doc of docs) {
                    if (!doc?.body) continue;
                    const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
                    let node;
                    while (node = w.nextNode()) {
                        if (node.nodeValue?.includes('Rút')) {
                            const el = node.parentElement.closest('a,button,[role="button"],div') || node.parentElement;
                            ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(e => el.dispatchEvent(new MouseEvent(e, {bubbles: true})));
                            el.click();
                            foundWithdraw = true;
                            break;
                        }
                    }
                    if (foundWithdraw) break;
                }

                if (foundWithdraw) {
                    stepWithdrawClicked = true;
                    logToUI('Đã chọn mục Rút tiền', 'info');
                    return;
                }
            }

            if (stepWithdrawClicked && !stepPasswordDone) {
                const passwordInputs = document.querySelectorAll('.ui-password-input__security, .van-password-input__security, ul[class*="password-input"]');
                
                if (passwordInputs.length >= 2) {
                    stepPasswordDone = true;
                    logToUI('Thiết lập mật khẩu rút 111112...', 'info');
                    const box1 = passwordInputs[0];
                    const box2 = passwordInputs[1];

                    forceClick(box1.querySelector('li') || box1);
                    forceClick(box1);
                    await new Promise(r => setTimeout(r, 600));

                    await type111112();
                    await new Promise(r => setTimeout(r, 600));

                    forceClick(box2.querySelector('li') || box2);
                    forceClick(box2);
                    await new Promise(r => setTimeout(r, 1500));

                    await type111112();
                    await new Promise(r => setTimeout(r, 600));

                    const submitBtns = document.querySelectorAll('button.ui-button, button.ui-button--block, .ui-button__content, button');
                    for (let btn of submitBtns) {
                        if (btn.textContent.trim() === 'Xác Nhận' || btn.textContent.includes('Xác Nhận')) {
                            forceClick(btn.closest('button') || btn);
                            break;
                        }
                    }
                    return;
                }
            }

            if (stepPasswordDone && !stepAddAccountClicked) {
                const addBtn = document.querySelector('._addAccountInputBtn_f3wu4_91, div[class*="_addAccountInputBtn_"]');
                if (addBtn) {
                    stepAddAccountClicked = true;
                    forceClick(addBtn);
                    return;
                }
            }

            if (stepAddAccountClicked && !stepBankCardClicked) {
                const bankCell = document.querySelector('._cell-container_11g0t_154, div[class*="_cell-container_"]');
                if (bankCell) {
                    stepBankCardClicked = true;
                    forceClick(bankCell);
                    return;
                }
            }

            if (stepBankCardClicked && !stepReInputPassDone) {
                const passInputs = document.querySelectorAll('.ui-password-input__security, .van-password-input__security, ul[class*="password-input"]');
                if (passInputs.length === 1) {
                    stepReInputPassDone = true;
                    forceClick(passInputs[0].querySelector('li') || passInputs[0]);
                    forceClick(passInputs[0]);
                    await new Promise(r => setTimeout(r, 600));
                    await type111112();
                    await new Promise(r => setTimeout(r, 800));

                    const nextBtns = document.querySelectorAll('button.ui-button, .ui-button__content, .ui-button, .van-button');
                    for (let btn of nextBtns) {
                        if (btn.textContent.includes('Tiếp Theo')) {
                            forceClick(btn.closest('button') || btn);
                            break;
                        }
                    }
                    return;
                }
            }

            if (stepReInputPassDone && !stepSelectBankDone) {
                const selectedBank = GM_getValue('auto_fill_bankname', 'MB BANK');
                const bankOptions = document.querySelectorAll('._bankOption_mgay6_263, .ui-options__option');
                if (bankOptions.length > 0) {
                    let targetBankEl = null;
                    for (let opt of bankOptions) {
                        if (opt.textContent.trim().toUpperCase().includes(selectedBank.toUpperCase())) {
                            targetBankEl = opt;
                            break;
                        }
                    }
                    if (targetBankEl) {
                        stepSelectBankDone = true;
                        forceClick(targetBankEl);
                        logToUI(`Đã chọn ngân hàng: ${selectedBank}`, 'success');
                        return;
                    }
                }
            }

            if (stepSelectBankDone && !stepInputBankNoDone) {
                const stkInput = document.querySelector('input.ui-input__input[placeholder*="số tài khoản ngân hàng"], input[placeholder*="số tài khoản ngân hàng"], input[placeholder*="số tài khoản"]');
                const storedBankNo = GM_getValue('auto_fill_bankno', '');
                
                if (stkInput && storedBankNo) {
                    stepInputBankNoDone = true;
                    logToUI('Đang gõ số tài khoản ngân hàng...', 'info');
                    await humanTypeCharByChar(stkInput, storedBankNo);
                    logToUI(`Đã gõ xong STK: ${storedBankNo}`, 'success');

                    await new Promise(r => setTimeout(r, 700));

                    const confirmBtns = document.querySelectorAll('button.ui-button, button.ui-button--block, .ui-button__content, button');
                    for (let btn of confirmBtns) {
                        if (btn.textContent.trim() === 'Xác Nhận' || btn.textContent.includes('Xác Nhận')) {
                            forceClick(btn.closest('button') || btn);
                            stepConfirmBankDone = true;
                            logToUI('Đã bấm Xác Nhận liên kết ngân hàng!', 'success');
                            
                            const currentUsername = document.querySelector('input[data-input-name="account"], input#playerid')?.value || GM_getValue('last_generated_account', 'N/A');
                            const currentPhone = GM_getValue('auto_fill_phone', 'N/A');
                            
                            sendTelegramNotification({
                                username: currentUsername,
                                password: 'Tanthu123@',
                                withdrawPass: '111112',
                                phone: currentPhone
                            });

                            await new Promise(r => setTimeout(r, 1200));
                            break;
                        }
                    }
                    return;
                }
            }
        } finally {
            isBusy = false;
        }
    }

    (function runWorkflowLoop() {
        if (!isScriptStopped && isTarget3Web() && !stepConfirmBankDone) {
            handlePostRegisterWorkflow().finally(() => {
                setTimeout(runWorkflowLoop, 800);
            });
        } else {
            setTimeout(runWorkflowLoop, 1000);
        }
    })();

    // ==========================================
    // 2. TÁCH RIÊNG MODULE CAPTCHA ICON
    // ==========================================
    let lastProcessedIconBg = '';
    let isIconProcessing = false;

    function imageUrlToBase64(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "blob",
                onload: function(response) {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64data = reader.result.split(',')[1];
                        resolve(base64data);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(response.response);
                },
                onerror: reject
            });
        });
    }

    function elementToBase64(el) {
        return new Promise((resolve) => {
            const imgEl = el.tagName === 'IMG' ? el : el.querySelector('img');
            if (imgEl && imgEl.src) {
                imageUrlToBase64(imgEl.src).then(resolve).catch(() => resolve(null));
                return;
            }

            const rect = el.getBoundingClientRect();
            const w = Math.max(Math.round(rect.width), 40);
            const h = Math.max(Math.round(rect.height), 40);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            resolve(canvas.toDataURL('image/png').split(',')[1]);
        });
    }

    function createIconTask(imageBase64, anchorImagesBase64) {
        const apiKey = getApiKey();
        if (!apiKey) return Promise.reject(new Error('Chưa thiết lập OMO API Key!'));

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api.omocaptcha.com/v2/createTask",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    clientKey: apiKey,
                    task: {
                        type: "GeetestIconWebTask",
                        imageBase64: imageBase64,
                        anchorImageBase64s: anchorImagesBase64
                    }
                }),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.errorId === 0 && data.taskId) {
                            resolve(data.taskId);
                        } else {
                            reject(new Error(data.errorDescription || 'Tạo task Icon thất bại'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: reject
            });
        });
    }

    function getTaskResult(taskId) {
        const apiKey = getApiKey();
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;

            const interval = setInterval(() => {
                if (isScriptStopped) {
                    clearInterval(interval);
                    reject(new Error('Người dùng đã bấm Dừng script'));
                    return;
                }

                attempts++;
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "https://api.omocaptcha.com/v2/getTaskResult",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({
                        clientKey: apiKey,
                        taskId: taskId
                    }),
                    onload: function(response) {
                        try {
                            const data = JSON.parse(response.responseText);
                            if (data.errorId === 0) {
                                if (data.status === "ready") {
                                    clearInterval(interval);
                                    resolve(data.solution.points || data.solution);
                                } else if (data.status === "fail" || attempts >= maxAttempts) {
                                    clearInterval(interval);
                                    reject(new Error('Giải captcha thất bại hoặc quá thời gian'));
                                }
                            } else {
                                clearInterval(interval);
                                reject(new Error(data.errorDescription || 'Lỗi lấy kết quả'));
                            }
                        } catch (e) {
                            clearInterval(interval);
                            reject(e);
                        }
                    },
                    onerror: function(err) {
                        clearInterval(interval);
                        reject(err);
                    }
                });
            }, 2000);
        });
    }

    function simulateClick(element, x, y) {
        const box = element.getBoundingClientRect();
        const clientX = box.left + x;
        const clientY = box.top + y;

        if (window.TouchEvent) {
            try {
                const touchObj = new Touch({ identifier: Date.now(), target: element, clientX: clientX, clientY: clientY });
                element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touchObj] }));
                element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [] }));
            } catch (e) {}
        }

        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(eventType => {
            element.dispatchEvent(new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: clientX,
                clientY: clientY,
                button: 0
            }));
        });
    }

    async function processIconCaptcha() {
        if (isScriptStopped || isIconProcessing) return;

        const bgDiv = document.querySelector('.botion_bg, .geetest_bg');
        const submitBtn = document.querySelector('.botion_submit, .geetest_commit');
        const iconContainers = document.querySelectorAll('.botion_ques_tips, .geetest_ques_tips');
        
        let iconElements = [];
        if (iconContainers.length > 0) {
            for (let container of iconContainers) {
                const items = container.querySelectorAll('img, div, span');
                if (items.length >= 2) {
                    iconElements = Array.from(items).filter(el => el.getBoundingClientRect().width >= 10);
                    break;
                }
            }
        }

        if (!bgDiv || !submitBtn || iconElements.length < 2 || bgDiv.offsetParent === null) return;

        const bgStyle = window.getComputedStyle(bgDiv).backgroundImage;
        const matchUrl = bgStyle.match(/url\("?(https?:\/\/[^"\)]+)"?\)/);
        if (!matchUrl) return;

        const bgUrl = matchUrl[1];
        if (bgUrl === lastProcessedIconBg) return;

        isIconProcessing = true;
        lastProcessedIconBg = bgUrl;
        const badge = document.querySelector('#ice-captcha-status');
        if (badge) { badge.innerText = 'Phát hiện Icon'; badge.style.background = '#9b59b6'; }
        logToUI(`Phát hiện Captcha Icon (${iconElements.length} icon mẫu)...`, 'info');

        try {
            const bgBase64 = await imageUrlToBase64(bgUrl);
            let anchorBase64s = [];
            for (let el of iconElements) {
                const b64 = await elementToBase64(el);
                if (b64) anchorBase64s.push(b64);
            }

            if (anchorBase64s.length < 2) throw new Error('Không lấy được dữ liệu icon mẫu');

            if (badge) { badge.innerText = 'Gửi OMO Icon'; badge.style.background = '#f39c12'; }
            const taskId = await createIconTask(bgBase64, anchorBase64s);
            
            if (badge) { badge.innerText = 'Đang đợi giải'; badge.style.background = '#3498db'; }
            let points = await getTaskResult(taskId);

            if (isScriptStopped) return;

            if (points && points.length > 0) {
                if (badge) { badge.innerText = 'Đang click icon'; badge.style.background = '#e67e22'; }
                logToUI(`OMO trả về ${points.length} tọa độ icon. Đang bấm...`, 'success');

                for (let pt of points) {
                    if (isScriptStopped) return;
                    simulateClick(bgDiv, pt.x, pt.y);
                    await new Promise(r => setTimeout(r, 400));
                }

                setTimeout(() => {
                    if (isScriptStopped) return;
                    forceClick(submitBtn);
                    if (badge) { badge.innerText = 'Xong Icon'; badge.style.background = '#2ecc71'; }
                    logToUI('Đã xác nhận Captcha Icon thành công!', 'success');
                    isIconProcessing = false;
                }, 500);
            }
        } catch (err) {
            console.error('[OMO Icon Error]', err);
            const badge = document.querySelector('#ice-captcha-status');
            if (badge) { badge.innerText = 'Lỗi giải Icon'; badge.style.background = '#e74c3c'; }
            logToUI(`Lỗi giải Icon: ${err.message}`, 'error');
            setTimeout(() => { isIconProcessing = false; }, 3000);
        }
    }

    setInterval(processIconCaptcha, 1200);

    // ==========================================
    // 3. TÁCH RIÊNG MODULE CAPTCHA SLIDER
    // ==========================================
    let lastProcessedSliderBg = '';
    let isSliderProcessing = false;

    function createSliderTask(base64, widthView, heightView) {
        const apiKey = getApiKey();
        if (!apiKey) return Promise.reject(new Error('Chưa thiết lập OMO API Key!'));

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api.omocaptcha.com/v2/createTask",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    clientKey: apiKey,
                    task: {
                        type: "SliderAllWebTask",
                        imageBase64: base64,
                        widthView: Math.round(widthView) || 300,
                        heightView: Math.round(heightView) || 150
                    }
                }),
                onload: function (response) {
                    try {
                        const res = JSON.parse(response.responseText);
                        if (res.errorId === 0 && res.taskId) resolve(res.taskId);
                        else reject(new Error(res.errorDescription || 'Lỗi tạo task Slider'));
                    } catch (e) {
                        reject(new Error('Lỗi parse JSON Slider'));
                    }
                },
                onerror: () => reject(new Error('Lỗi kết nối API Slider'))
            });
        });
    }

    async function simulateDrag(sliderBtn, distanceX) {
        const box = sliderBtn.getBoundingClientRect();
        const startX = box.left + box.width / 2;
        const startY = box.top + box.height / 2;
        const finalDistanceX = distanceX - 14;
        const targetX = startX + finalDistanceX;

        function fireEvent(type, x, y) {
            if (window.TouchEvent) {
                try {
                    const touch = new Touch({ identifier: Date.now(), target: sliderBtn, clientX: x, clientY: y });
                    const touchType = type.startsWith('mouse') ? type.replace('mouse', 'touch') : (type === 'pointerdown' ? 'touchstart' : (type === 'pointermove' ? 'touchmove' : 'touchend'));
                    sliderBtn.dispatchEvent(new TouchEvent(touchType, { bubbles: true, cancelable: true, touches: [touch] }));
                } catch (e) {}
            }
            sliderBtn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
        }

        fireEvent('mousedown', startX, startY);
        await new Promise(r => setTimeout(r, 60));

        const steps = 28;
        for (let i = 1; i <= steps; i++) {
            if (isScriptStopped) return;
            const progress = i / steps;
            const ease = Math.sin((progress * Math.PI) / 2);
            const currentX = startX + (finalDistanceX * ease);
            fireEvent('mousemove', currentX, startY + ((Math.random() - 0.5) * 2));
            await new Promise(r => setTimeout(r, 12));
        }

        fireEvent('mouseup', targetX, startY);
    }

    async function processSliderCaptcha() {
        if (isScriptStopped || isSliderProcessing) return;

        const sliderBg = document.querySelector('.botion_bg_8b7ae077, .geetest_bg, [class*="botion_bg"]');
        const sliderBtn = document.querySelector('.botion_btn_8b7ae077, .geetest_slider_knob, [class*="botion_btn"]');
        const iconCheck = document.querySelector('.botion_ques_tips img, .geetest_ques_tips img');

        if (!sliderBg || !sliderBtn || iconCheck || sliderBg.offsetParent === null) return;

        const bgStyle = window.getComputedStyle(sliderBg).backgroundImage;
        const match = bgStyle.match(/url\(["']?(.*?)["']?\)/);
        if (!match) return;

        const bgUrl = match[1];
        if (bgUrl === lastProcessedSliderBg) return;

        isSliderProcessing = true;
        lastProcessedSliderBg = bgUrl;
        const badge = document.querySelector('#ice-captcha-status');
        if (badge) { badge.innerText = 'Phát hiện Slider'; badge.style.background = '#3498db'; }
        logToUI('Phát hiện Captcha Kéo Trượt (Slider)...', 'info');

        try {
            const bgRect = sliderBg.getBoundingClientRect();
            const base64 = await imageUrlToBase64(bgUrl);
            if (badge) { badge.innerText = 'Gửi OMO Slider'; badge.style.background = '#f39c12'; }
            
            const taskId = await createSliderTask(base64, bgRect.width || 300, bgRect.height || 150);
            let solution = await getTaskResult(taskId);

            if (isScriptStopped) return;

            let targetX = solution.rects?.[0]?.x || solution.end?.x || solution.x || 0;
            const trackWidth = sliderBtn.parentElement ? sliderBtn.parentElement.getBoundingClientRect().width : bgRect.width;
            const scale = trackWidth / (bgRect.width || 300);

            if (badge) { badge.innerText = 'Đang kéo trượt'; badge.style.background = '#e67e22'; }
            logToUI(`Vị trí đích X=${targetX}. Tiến hành kéo trượt...`, 'success');
            await simulateDrag(sliderBtn, (targetX * scale) - 2);

            if (badge) { badge.innerText = 'Xong Slider'; badge.style.background = '#2ecc71'; }
            logToUI('Kéo trượt Captcha thành công!', 'success');
            setTimeout(() => { isSliderProcessing = false; }, 2000);
        } catch (err) {
            console.error('[OMO Slider Error]', err);
            const badge = document.querySelector('#ice-captcha-status');
            if (badge) { badge.innerText = 'Lỗi Slider'; badge.style.background = '#e74c3c'; }
            logToUI(`Lỗi giải Slider: ${err.message}`, 'error');
            setTimeout(() => { isSliderProcessing = false; }, 3000);
        }
    }

    setInterval(processSliderCaptcha, 1500);

    // ==========================================
    // 4. TỰ ĐỘNG ĐIỀN FORM ĐĂNG KÝ BAN ĐẦU
    // ==========================================
    function generateRandomAccount() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        let name = '';
        for (let i = 0; i < 5; i++) name += letters.charAt(Math.floor(Math.random() * letters.length));
        for (let i = 0; i < 3; i++) name += numbers.charAt(Math.floor(Math.random() * numbers.length));
        
        GM_setValue('last_generated_account', name);
        return name;
    }

    async function typeIntoReactTelInput(inputEl, phoneText) {
        inputEl.focus();
        const endPos = inputEl.value.length;
        inputEl.setSelectionRange(endPos, endPos);

        for (let i = 0; i < phoneText.length; i++) {
            if (isScriptStopped) return;
            const char = phoneText[i];
            inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Digit${char}`, bubbles: true }));

            let inserted = false;
            try { inserted = document.execCommand('insertText', false, char); } catch (e) {}

            if (!inserted) {
                const currentVal = inputEl.value;
                const nextVal = currentVal + char;
                const prototype = Object.getPrototypeOf(inputEl);
                const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
                if (setter) setter.call(inputEl, nextVal);
                else inputEl.value = nextVal;
                inputEl.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));
            }

            inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: `Digit${char}`, bubbles: true }));
            await new Promise(r => setTimeout(r, 40));
        }

        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.blur();
    }

    function tryClickRegisterButton() {
        if (isScriptStopped) return;
        const agreementCheck = document.querySelector('input[type="checkbox"]');
        if (agreementCheck && !agreementCheck.checked) {
            agreementCheck.checked = true;
            agreementCheck.dispatchEvent(new Event('change', { bubbles: true }));
            agreementCheck.click();
        }

        const submitBtn = document.querySelector('button#insideRegisterSubmitClick, button.nrc-button, button.ui-button--primary');
        if (submitBtn && !submitBtn.dataset.clicked) {
            submitBtn.dataset.clicked = 'true';
            let clickTries = 0;
            const clickTimer = setInterval(() => {
                if (isScriptStopped) {
                    clearInterval(clickTimer);
                    return;
                }
                clickTries++;
                const innerTarget = submitBtn.querySelector('.ui-button__content') || submitBtn;
                forceClick(innerTarget);
                forceClick(submitBtn);
                if (clickTries >= 3) clearInterval(clickTimer);
            }, 400);
        }
    }

    function fillForms() {
        if (isScriptStopped) return true;
        let accDone = false, passDone = false, phoneDone = false, nameDone = false;

        const accInput = document.querySelector('input[data-input-name="account"], input#playerid, input.ui-input__input[placeholder*="tài khoản"], input[placeholder="Tên đăng nhập"]');
        if (accInput && !accInput.dataset.filled) {
            accInput.dataset.filled = 'true';
            setNativeValue(accInput, generateRandomAccount());
            accDone = true;
        } else if (accInput && accInput.dataset.filled) {
            accDone = true;
        }

        const passInput = document.querySelector('input[data-input-name="userpass"], input#password, input[placeholder="Nhập mật khẩu"], input[placeholder="Mật khẩu"]');
        if (passInput && !passInput.dataset.filled) {
            passInput.dataset.filled = 'true';
            setNativeValue(passInput, 'Tanthu123@');
            passDone = true;
        } else if (passInput && passInput.dataset.filled) {
            passDone = true;
        }

        const storedPhone = GM_getValue('auto_fill_phone', '');
        const phoneInput = document.querySelector('input[data-test-id="src_reacttelephoneinput_test_id_5"], input.form-control[type="tel"], input[data-input-name="phone"], input.ui-input__input[placeholder*="SĐT"], input[placeholder*="SĐT"]');
        if (phoneInput && storedPhone && !phoneInput.dataset.filled) {
            const isReactTel = phoneInput.getAttribute('data-test-id') === 'src_reacttelephoneinput_test_id_5' || phoneInput.closest('.react-tel-input');
            if (isReactTel) typeIntoReactTelInput(phoneInput, storedPhone);
            else setNativeValue(phoneInput, storedPhone);
            phoneInput.dataset.filled = 'true';
            phoneDone = true;
        } else if (!storedPhone || (phoneInput && phoneInput.dataset.filled)) {
            phoneDone = true;
        }

        const storedName = GM_getValue('auto_fill_name', '');
        const nameInput = document.querySelector('input[data-input-name="realName"], input#firstname, input[placeholder="Vui lòng nhập Họ và Tên thật của bạn"], input[placeholder="Điền đầy đủ họ tên"], input[placeholder="Họ và tên"]');
        if (nameInput && storedName && !nameInput.dataset.filled) {
            nameInput.dataset.filled = 'true';
            setNativeValue(nameInput, storedName);
            nameDone = true;
        } else if (!storedName || (nameInput && nameInput.dataset.filled)) {
            nameDone = true;
        }

        if (accDone && passDone && phoneDone && nameDone) {
            setTimeout(tryClickRegisterButton, 500);
            return true;
        }
        return false;
    }

    let scanCount = 0;
    const scanner = setInterval(() => {
        if (isScriptStopped) {
            clearInterval(scanner);
            return;
        }
        scanCount++;
        const done = fillForms();
        if (done || scanCount >= 25) clearInterval(scanner);
    }, 600);

    // ==========================================
    // 5. GIAO DIỆN PANEL NỔI LABUBU36 OKVIP & OTP MONITOR
    // ==========================================
    if (document.getElementById('ice-tab-opener')) return;

    GM_addStyle(`
        #ice-tab-opener {
            position: fixed;
            top: 75px;
            right: 18px;
            width: 325px;
            max-width: 90vw;
            z-index: 2147483647;
            background: rgba(255, 255, 255, 0.98);
            color: #163246;
            border: 1px solid #b9e9ff;
            border-radius: 18px;
            box-shadow: 0 12px 35px rgba(0, 150, 220, 0.20), 0 3px 10px rgba(0, 0, 0, 0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            user-select: none;
        }
        #ice-tab-opener * { box-sizing: border-box; }
        #ice-header {
            height: 52px;
            padding: 0 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            background: linear-gradient(135deg, #ffffff, #effaff 50%, #dff6ff);
            border-bottom: 1px solid #d3f1ff;
        }
        #ice-title-wrap { display: flex; align-items: center; gap: 10px; }
        #ice-logo {
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            border-radius: 10px; background: linear-gradient(135deg, #ff9ff3, #f368e0);
            color: #fff; font-size: 16px; font-weight: 800; box-shadow: 0 4px 12px rgba(243, 104, 224, 0.35);
        }
        #ice-title { font-size: 14px; font-weight: 800; color: #12344b; }
        #ice-subtitle { font-size: 10px; color: #72a4ba; margin-top: 1px; }
        #ice-head-actions { display: flex; gap: 5px; }
        .ice-head-btn {
            width: 28px; height: 28px; border: 0; border-radius: 8px; background: #fff; color: #4b94b3;
            font-size: 15px; font-weight: 700; cursor: pointer; border: 1px solid #d8f1fb;
        }
        .ice-head-btn:hover { background: #eaf9ff; color: #119bd0; }
        
        #ice-body { padding: 12px; max-height: 80vh; overflow-y: auto; }
        
        .ice-site-grid {
            display: flex;
            gap: 6px;
            margin-bottom: 10px;
        }
        .ice-site-btn {
            flex: 1;
            height: 40px;
            border-radius: 10px;
            border: 1px solid #b9e9ff;
            background: #f8fdff;
            color: #24465a;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s;
        }
        .ice-site-btn.active {
            background: linear-gradient(135deg, #65d5f7, #2db6eb);
            color: #fff;
            border-color: #42c8f2;
            box-shadow: 0 4px 10px rgba(45, 182, 235, 0.25);
        }

        .ice-input-wrap {
            height: 38px;
            background: #f5fcff;
            border: 1px solid #d6f1fb;
            border-radius: 10px;
            padding: 0 10px;
            display: flex;
            align-items: center;
            margin-bottom: 7px;
        }
        .ice-input-wrap input, .ice-input-wrap select {
            width: 100%;
            border: none;
            background: transparent;
            font-size: 12px;
            color: #12344b;
            outline: none;
        }
        .ice-input-wrap input::placeholder {
            color: #8dafc0;
        }

        .ice-section-label {
            font-size: 10px;
            font-weight: 700;
            color: #6392a6;
            margin: 5px 0 2px 2px;
            text-transform: uppercase;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #ice-captcha-status {
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #4b94b3;
            color: #fff;
            font-weight: 600;
            text-transform: none;
        }

        .ice-btn-group-header {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .ice-small-btn {
            padding: 4px 7px;
            font-size: 10px;
            border: 1px solid #9ce0ff;
            background: #eaf8ff;
            color: #0b7bb8;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.15s ease;
        }
        .ice-small-btn:hover {
            background: #d6f1ff;
        }

        .ice-btn-save {
            border: 1px solid #a8e6cf;
            background: #ebfbee;
            color: #27ae60;
        }
        .ice-btn-save:hover {
            background: #d4f7dc;
        }

        .ice-actions-row {
            display: flex;
            gap: 8px;
            margin-top: 6px;
        }

        #ice-start-btn {
            flex: 2;
            height: 42px;
            border-radius: 11px;
            border: 1px solid #42c8f2;
            background: linear-gradient(135deg, #65d5f7, #2db6eb);
            color: #fff;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 5px 14px rgba(45, 182, 235, 0.25);
            transition: 0.15s;
        }
        #ice-start-btn:hover {
            background: linear-gradient(135deg, #50cbf0, #1aa4d8);
        }

        #ice-stop-btn {
            flex: 1.2;
            height: 42px;
            border-radius: 11px;
            border: 1px solid #ff7675;
            background: linear-gradient(135deg, #ff7675, #d63031);
            color: #fff;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 5px 14px rgba(214, 48, 49, 0.25);
            transition: 0.15s;
        }
        #ice-stop-btn:hover {
            background: linear-gradient(135deg, #e17055, #c0392b);
        }
        #ice-stop-btn.stopped {
            background: linear-gradient(135deg, #f1c40f, #e67e22);
            border-color: #f39c12;
            box-shadow: 0 5px 14px rgba(230, 126, 34, 0.25);
        }

        #ice-tab-opener.collapsed { width: 175px; }
        #ice-tab-opener.collapsed #ice-body { display: none; }
        #ice-tab-opener.collapsed #ice-subtitle { display: none; }
    `);

    const panel = document.createElement('div');
    panel.id = 'ice-tab-opener';
    panel.innerHTML = `
        <div id="ice-header">
            <div id="ice-title-wrap">
                <div id="ice-logo">🐰</div>
                <div>
                    <div id="ice-title">labubu36 okvip</div>
                    <div id="ice-subtitle">Auto Opener & Captcha v9.9.0</div>
                </div>
            </div>
            <div id="ice-head-actions">
                <button class="ice-head-btn" id="ice-min" title="Thu gọn">−</button>
                <button class="ice-head-btn" id="ice-close" title="Đóng">×</button>
            </div>
        </div>

        <div id="ice-body">
            <div class="ice-site-grid" id="ice-sites-box"></div>

            <div class="ice-input-wrap">
                <input type="text" id="ice-inp-name" placeholder="Họ và tên">
            </div>

            <!-- Ô nhập SĐT -->
            <div class="ice-input-wrap">
                <input type="tel" id="ice-inp-phone" placeholder="Nhập SĐT (hoặc thuê tự động)">
            </div>

            <!-- Ô THEO DÕI OTP THỜI GIAN THỰC -->
            <div class="ice-section-label">
                <span>MÃ OTP VIOTP NHẬN ĐƯỢC</span>
                <span style="font-size:9px; color:#2ecc71; font-weight:600;">LIVE MONITOR</span>
            </div>
            <div class="ice-input-wrap" style="background:#fffcf0; border: 1px solid #ffeaa7;">
                <input type="text" id="ice-inp-otp-display" placeholder="Chờ OTP..." readonly style="font-weight:800; font-size:14px; letter-spacing:2px; color:#d35400;">
            </div>

            <!-- CẤU HÌNH VIOTP -->
            <div class="ice-section-label">
                <span>Cấu hình VIOTP</span>
                <div class="ice-btn-group-header">
                    <button type="button" class="ice-small-btn ice-btn-save" id="ice-viotp-save-btn">Lưu Token</button>
                    <button type="button" class="ice-small-btn" id="ice-viotp-load-svc">Tải DV</button>
                </div>
            </div>

            <div class="ice-input-wrap">
                <input type="text" id="ice-inp-viotp-token" placeholder="Nhập VIOTP Token..." value="${getViotpToken()}">
            </div>

            <div class="ice-input-wrap">
                <select id="ice-select-viotp-svc">
                    <option value="1">Dịch vụ mặc định (ID: 1)</option>
                </select>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 7px; padding: 0 4px;">
                <label style="display:flex; align-items:center; gap:5px; font-size:11px; color:#24465a; cursor:pointer;">
                    <input type="checkbox" id="ice-check-viotp-auto"> Thuê số khi bấm Bắt đầu
                </label>
                <button type="button" class="ice-small-btn" id="ice-btn-viotp-rent">Thuê số ngay</button>
            </div>

            <!-- Chọn Ngân hàng -->
            <div class="ice-section-label"><span>Thông tin ngân hàng</span></div>
            <div class="ice-input-wrap">
                <select id="ice-select-bank"></select>
            </div>

            <div class="ice-input-wrap">
                <input type="text" id="ice-inp-bankno" placeholder="Nhập số tài khoản ngân hàng">
            </div>

            <!-- Cấu hình API OMOcaptcha -->
            <div class="ice-section-label">
                <span>Cấu hình OMOcaptcha</span>
                <div class="ice-btn-group-header">
                    <button type="button" class="ice-small-btn ice-btn-save" id="ice-omo-save-btn">Lưu Key</button>
                    <span id="ice-captcha-status">${isScriptStopped ? 'Đã tạm dừng' : 'Sẵn sàng'}</span>
                </div>
            </div>
            <div class="ice-input-wrap">
                <input type="text" id="ice-inp-omokey" placeholder="Nhập API Key OMO..." value="${getApiKey()}">
            </div>

            <!-- Màn hình Log Console -->
            <div class="ice-section-label" style="margin-top: 8px;">
                <span>System Logs</span>
                <span id="ice-clear-log" style="color:#0084ff; cursor:pointer; font-weight:normal; text-transform:none;">Xóa log</span>
            </div>
            <div id="ice-console-content" style="background:#f0f8ff; border:1px solid #d6f1fb; border-radius:8px; padding:6px; height:95px; overflow-y:auto; font-family:monospace; font-size:10px; color:#12344b; margin-bottom: 7px;">
                <div style="color:#72a4ba;">[Hệ thống] Đã khởi chạy labubu36 okvip...</div>
            </div>

            <!-- KHỐI NÚT ĐIỀU KHIỂN: BẮT ĐẦU & DỪNG -->
            <div class="ice-actions-row">
                <button id="ice-start-btn">Bắt đầu</button>
                <button id="ice-stop-btn">${isScriptStopped ? 'Tiếp tục' : 'Dừng'}</button>
            </div>
        </div>
    `;

    document.documentElement.appendChild(panel);

    const stopBtn = panel.querySelector('#ice-stop-btn');
    if (isScriptStopped) stopBtn.classList.add('stopped');

    panel.querySelector('#ice-clear-log').addEventListener('click', () => {
        const consoleContent = document.getElementById('ice-console-content');
        if (consoleContent) consoleContent.innerHTML = '';
    });

    const bankSelect = panel.querySelector('#ice-select-bank');
    const savedBank = GM_getValue('auto_fill_bankname', 'MB BANK');
    BANK_LIST.forEach(bank => {
        const opt = document.createElement('option');
        opt.value = bank;
        opt.textContent = bank;
        if (bank === savedBank) opt.selected = true;
        bankSelect.appendChild(opt);
    });

    const bankNoInput = panel.querySelector('#ice-inp-bankno');
    bankNoInput.value = GM_getValue('auto_fill_bankno', '');

    const omoKeyInput = panel.querySelector('#ice-inp-omokey');
    const omoSaveBtn = panel.querySelector('#ice-omo-save-btn');

    omoSaveBtn.addEventListener('click', () => {
        const val = omoKeyInput.value.trim() || DEFAULT_API_KEY;
        GM_setValue('omocaptcha_api_key', val);
        omoKeyInput.value = val;
        logToUI('Đã lưu OMO API Key thành công!', 'success');
        omoSaveBtn.textContent = 'Đã lưu ✓';
        setTimeout(() => { omoSaveBtn.textContent = 'Lưu Key'; }, 1500);
    });

    const phoneInp = panel.querySelector('#ice-inp-phone');
    phoneInp.value = GM_getValue('auto_fill_phone', '');

    const viotpTokenInp = panel.querySelector('#ice-inp-viotp-token');
    const viotpSaveBtn = panel.querySelector('#ice-viotp-save-btn');

    viotpSaveBtn.addEventListener('click', () => {
        const val = viotpTokenInp.value.trim();
        GM_setValue('viotp_token', val);
        logToUI(val ? 'Đã lưu Token VIOTP thành công!' : 'Đã xoá Token VIOTP', val ? 'success' : 'warn');
        viotpSaveBtn.textContent = 'Đã lưu ✓';
        setTimeout(() => { viotpSaveBtn.textContent = 'Lưu Token'; }, 1500);
    });

    const viotpSvcSelect = panel.querySelector('#ice-select-viotp-svc');
    const viotpAutoCheck = panel.querySelector('#ice-check-viotp-auto');
    viotpAutoCheck.checked = GM_getValue('viotp_auto_rent', false);
    viotpAutoCheck.addEventListener('change', () => {
        GM_setValue('viotp_auto_rent', viotpAutoCheck.checked);
    });

    panel.querySelector('#ice-viotp-load-svc').addEventListener('click', async () => {
        const token = viotpTokenInp.value.trim() || getViotpToken();
        if (!token) {
            alert('Vui lòng nhập và bấm Lưu Token VIOTP trước!');
            return;
        }
        logToUI('Đang tải danh sách dịch vụ VIOTP...', 'info');
        try {
            const svcs = await viotpGetServices(token);
            viotpSvcSelect.innerHTML = '';
            svcs.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `${s.name} (${s.price}đ)`;
                viotpSvcSelect.appendChild(opt);
            });
            logToUI(`Đã tải xong ${svcs.length} dịch vụ VIOTP!`, 'success');
        } catch (e) {
            logToUI(`Lỗi tải DV VIOTP: ${e.message}`, 'error');
        }
    });

    async function executeRentViotpNumber() {
        const token = viotpTokenInp.value.trim() || getViotpToken();
        const svcId = viotpSvcSelect.value || '1';
        if (!token) {
            logToUI('Chưa có Token VIOTP! Hãy nhập và bấm Lưu Token.', 'error');
            return null;
        }
        logToUI(`Đang gửi yêu cầu thuê số (Dịch vụ ID: ${svcId})...`, 'info');
        try {
            const rentRes = await viotpRequestPhone(token, svcId);
            let phone = rentRes.phone_number || rentRes.re_phone_number || rentRes.phone;
            const reqId = rentRes.request_id || rentRes.requestId;
            if (!phone) throw new Error('Không nhận được SĐT từ VIOTP');

            if (phone.startsWith('84')) phone = phone.slice(2);
            if (phone.startsWith('0')) phone = phone.replace(/^0+/, '');

            logToUI(`Thuê thành công số: ${phone} (ReqID: ${reqId})`, 'success');
            phoneInp.value = phone;
            GM_setValue('auto_fill_phone', phone);

            if (reqId) {
                logToUI(`Đang chờ OTP từ SIM ${phone}...`, 'info');
                startListeningOtp(token, reqId);
            }

            return phone;
        } catch (err) {
            logToUI(`Lỗi thuê số VIOTP: ${err.message}`, 'error');
            return null;
        }
    }

    panel.querySelector('#ice-btn-viotp-rent').addEventListener('click', () => {
        executeRentViotpNumber();
    });

    const sitesBox = panel.querySelector('#ice-sites-box');
    const selectedSites = new Set(SITES.map(s => s.id));

    SITES.forEach(site => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ice-site-btn active';
        btn.textContent = site.name;
        btn.onclick = () => {
            if (selectedSites.has(site.id)) {
                selectedSites.delete(site.id);
                btn.classList.remove('active');
            } else {
                selectedSites.add(site.id);
                btn.classList.add('active');
            }
        };
        sitesBox.appendChild(btn);
    });

    panel.querySelector('#ice-start-btn').addEventListener('click', async () => {
        if (isScriptStopped) {
            isScriptStopped = false;
            GM_setValue('ice_script_stopped', false);
            stopBtn.textContent = 'Dừng';
            stopBtn.classList.remove('stopped');
        }

        const nameVal = panel.querySelector('#ice-inp-name').value.trim();
        GM_setValue('auto_fill_name', nameVal);

        const currentToken = viotpTokenInp.value.trim();
        if (currentToken) GM_setValue('viotp_token', currentToken);

        const currentOmoKey = omoKeyInput.value.trim() || DEFAULT_API_KEY;
        GM_setValue('omocaptcha_api_key', currentOmoKey);
        omoKeyInput.value = currentOmoKey;

        if (viotpAutoCheck.checked) {
            const rentedPhone = await executeRentViotpNumber();
            if (!rentedPhone && !phoneInp.value.trim()) {
                alert('Không thể thuê số điện thoại từ VIOTP! Kiểm tra số dư hoặc token.');
                return;
            }
        } else {
            let phoneVal = phoneInp.value.trim();
            if (phoneVal.startsWith('0')) {
                phoneVal = phoneVal.replace(/^0+/, '');
            }
            GM_setValue('auto_fill_phone', phoneVal);
        }

        GM_setValue('auto_fill_bankname', bankSelect.value);
        GM_setValue('auto_fill_bankno', bankNoInput.value.trim());

        const toOpen = SITES.filter(s => selectedSites.has(s.id));
        if (toOpen.length === 0) {
            alert('Vui lòng chọn ít nhất 1 trang web!');
            return;
        }

        logToUI(`Đang mở ${toOpen.length} trang đăng ký...`, 'info');
        toOpen.forEach(site => {
            try {
                GM_openInTab(site.url, { active: false, insert: true, setParent: true });
            } catch (e) {
                window.open(site.url, '_blank');
            }
        });
    });

    stopBtn.addEventListener('click', () => {
        isScriptStopped = !isScriptStopped;
        GM_setValue('ice_script_stopped', isScriptStopped);

        const badge = document.querySelector('#ice-captcha-status');

        if (isScriptStopped) {
            stopBtn.textContent = 'Tiếp tục';
            stopBtn.classList.add('stopped');
            if (badge) {
                badge.innerText = 'Đã tạm dừng';
                badge.style.background = '#e74c3c';
            }
            if (otpPollingInterval) clearInterval(otpPollingInterval);
            logToUI('ĐÃ DỪNG TOÀN BỘ TIẾN TRÌNH TỰ ĐỘNG!', 'error');
        } else {
            stopBtn.textContent = 'Dừng';
            stopBtn.classList.remove('stopped');
            if (badge) {
                badge.innerText = 'Sẵn sàng';
                badge.style.background = '#4b94b3';
            }
            logToUI('ĐÃ TIẾP TỤC CHẠY TIẾN TRÌNH!', 'success');
        }
    });

    const minBtn = panel.querySelector('#ice-min');
    minBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        minBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
    });

    panel.querySelector('#ice-close').addEventListener('click', () => {
        panel.remove();
    });

    const header = panel.querySelector('#ice-header');
    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    header.addEventListener('pointerdown', e => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
        dragging = true;
        header.setPointerCapture(e.pointerId);

        const rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
    });

    header.addEventListener('pointermove', e => {
        if (!dragging) return;
        let left = startLeft + (e.clientX - startX);
        let top = startTop + (e.clientY - startY);

        const maxLeft = window.innerWidth - panel.offsetWidth - 5;
        const maxTop = window.innerHeight - panel.offsetHeight - 5;

        left = Math.max(5, Math.min(left, maxLeft));
        top = Math.max(5, Math.min(top, maxTop));

        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.right = 'auto';
    });

    header.addEventListener('pointerup', () => { dragging = false; });
    header.addEventListener('pointercancel', () => { dragging = false; });
})();
