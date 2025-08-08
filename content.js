async function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function uploadSingleImage(base64Data){
  const payload = {image: base64Data};

  const response = await fetch('https://contents-api.wrtn.ai/character/characters/situation-image', {
    headers: {
      'Authorization': `Bearer ${getCookie('access_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    method: 'POST',
    credentials: 'include',
    mode: 'cors'
  })
  if(!response.ok) throw new Error(`HTTP Error: ${response.status}`);

  const result = await response.json();
  if(result.result != 'SUCCESS') throw new Error(`failed`);
  return result.data.url;
}

let loading = false;

function toggleImageButton(on){
  const targetDiv = document.querySelector('div.css-fzjsyc.eh9908w0');
  if(targetDiv == null) return;
  
  const imageUploadBtn = targetDiv.querySelector('.image-upload-btn');
  if (!imageUploadBtn) return;

  if(on == true){
    loading = true;
    imageUploadBtn.textContent = '업로드 중...'
  }
  else{
    loading = false;
    imageUploadBtn.textContent = '이미지 등록'
  }
}

async function postImages(event) {
  if(loading == true) return;
  toggleImageButton(true);

  const target = event.target;

  const files = Array.from(target.files);
  if (files.length == 0) return;

  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const dataUrl = await fileToBase64(file);
      const base64Data = dataUrl.split(',')[1];

      const result = await uploadSingleImage(base64Data);
      
      const textarea = document.querySelector('textarea[name="content"].css-5dslcc.eh9908w0');
      if(textarea) textarea.value = `${textarea.value}\n![${i + 1}](${result})`.slice(0, 2000);

      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      console.error(error);
    }
  }
  
  target.value = '';
  return toggleImageButton(false);
}

function insertImageUploadBtn() {
  const targetDiv = document.querySelector('div.css-fzjsyc.eh9908w0');
  if(targetDiv == null) return;
  
  const existingBtn = targetDiv.querySelector('.image-upload-btn');
  if (existingBtn) return;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.jpeg,.jpg,.png,.webp,.gif';
  fileInput.multiple = true;
  fileInput.style.display = 'none';

  const imageUploadBtn = document.createElement('div');
  imageUploadBtn.className = 'image-upload-btn';
  imageUploadBtn.textContent = '이미지 등록';

  imageUploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', postImages);

  const firstChild = targetDiv.firstChild;
  if (firstChild) targetDiv.insertBefore(imageUploadBtn, firstChild);
  else targetDiv.appendChild(imageUploadBtn);
}

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') insertImageUploadBtn();
    });
  });

  // body 전체를 관찰
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => {
  insertImageUploadBtn();
  observeDOM();
});
else { insertImageUploadBtn(); observeDOM(); }