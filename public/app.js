document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const uploadButton = document.getElementById('upload-button');
    const queryForm = document.getElementById('query-form');
    const questionInput = document.getElementById('question');
    const queryButton = queryForm.querySelector('button');
    const responseDiv = document.getElementById('response');
    const loader = document.getElementById('loader');
    const previousFilesList = document.getElementById('previous-files-list');
    const predefinedQuestionsDiv = document.getElementById('predefined-questions');
    const modal = document.getElementById('source-modal');
    const modalContent = document.getElementById('modal-text-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let filesToUpload = [];
    let selectedFiles = [];

    fetchPreviousFiles();

    async function fetchPreviousFiles() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            renderPreviousFiles(files);
            updateQueryState();
        } catch (error) {
            console.error('Error fetching previous files:', error);
        }
    }

    function renderPreviousFiles(files) {
        previousFilesList.innerHTML = '';
        const selectAllBtn = document.getElementById('select-all-btn');

        if (files.length === 0) {
            document.getElementById('previous-files-container').style.display = 'none';
            selectAllBtn.classList.add('hidden');
            return;
        }
        
        document.getElementById('previous-files-container').style.display = 'block';
        selectAllBtn.classList.remove('hidden');
        
        selectedFiles = [...files];

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item previous-file';
            
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = file;
            checkbox.checked = true;
            checkbox.onchange = () => updateSelectedFiles();
            
            const fileName = document.createElement('span');
            fileName.textContent = file;
            
            label.appendChild(checkbox);
            label.appendChild(fileName);
            fileItem.appendChild(label);

            const buttonsWrapper = document.createElement('div');
            buttonsWrapper.className = 'file-item-buttons';

            const viewButton = document.createElement('a');
            viewButton.className = 'view-file-button';
            viewButton.textContent = 'View';
            viewButton.href = `/uploads/${file}`;
            viewButton.target = '_blank';
            buttonsWrapper.appendChild(viewButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-file-button';
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteFile(file);
            buttonsWrapper.appendChild(deleteButton);

            fileItem.appendChild(buttonsWrapper);
            previousFilesList.appendChild(fileItem);
        });
        updateSelectAllButton();
    }

    function updateSelectedFiles() {
        const checkboxes = previousFilesList.querySelectorAll('input[type="checkbox"]');
        selectedFiles = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        updateQueryState();
        updateSelectAllButton();
    }

    function updateQueryState() {
        const hasFiles = selectedFiles.length > 0;
        questionInput.disabled = !hasFiles;
        queryButton.disabled = !hasFiles;
        if (hasFiles) {
            predefinedQuestionsDiv.classList.remove('hidden');
        } else {
            predefinedQuestionsDiv.classList.add('hidden');
        }
    }

    function updateSelectAllButton() {
        const selectAllBtn = document.getElementById('select-all-btn');
        const allCheckboxes = previousFilesList.querySelectorAll('input[type="checkbox"]');
        const allSelected = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
        selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
    }

    document.getElementById('select-all-btn').addEventListener('click', () => {
        const allCheckboxes = previousFilesList.querySelectorAll('input[type="checkbox"]');
        const allSelected = selectedFiles.length === allCheckboxes.length;
        allCheckboxes.forEach(cb => {
            cb.checked = !allSelected;
        });
        updateSelectedFiles();
    });

    async function deleteFile(filename) {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
        showLoader(true, `Deleting ${filename}...`);
        try {
            const response = await fetch(`/api/files/${filename}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).message);
            fetchPreviousFiles();
        } catch (error) {
            responseDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            showLoader(false);
        }
    }

    predefinedQuestionsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('predefined-question-btn')) {
            questionInput.value = e.target.textContent;
        }
    });

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (newFiles.length > 0) {
            uploadFiles(newFiles);
        }
    });

    fileInput.addEventListener('change', () => {
        const newFiles = Array.from(fileInput.files);
        if (newFiles.length > 0) {
            uploadFiles(newFiles);
        }
    });

    function renderFileList(files) {
        fileList.innerHTML = '';
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item';
            fileItem.textContent = file.name;
            fileList.appendChild(fileItem);
        });
    }

    async function uploadFiles(filesToUpload) {
        if (filesToUpload.length === 0) return;
        
        const formData = new FormData();
        filesToUpload.forEach(file => formData.append('pdfs', file));
        
        showLoader(true, 'Ingesting documents...');
        responseDiv.innerHTML = '';
        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: 'Unknown error occurred during upload.' }));
                throw new Error(errorBody.message);
            }
            
            await fetchPreviousFiles();
        } catch (error) {
            responseDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            fileList.innerHTML = '';
            showLoader(false);
        }
    }

    // --- Custom Marked Renderer ---
    // We'll handle the chunk links after parsing instead of using a custom renderer
    // --- End Custom Marked Renderer ---

    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectedFiles.length < 1) {
            alert('Please select at least one PDF to query.');
            return;
        }
        showLoader(true, 'Generating response...');
        responseDiv.innerHTML = '';
        try {
            const response = await fetch('/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: questionInput.value, files: selectedFiles })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            // Parse the markdown response
            let htmlResponse = marked.parse(result.answer);
            
            // Convert chunk: links to clickable elements with data attributes
            htmlResponse = htmlResponse.replace(
                /<a href="chunk:([^"]+)">(\d+)<\/a>/g,
                '<a href="#" data-chunk-id="$1" class="chunk-link">[$2]</a>'
            );
            
            responseDiv.innerHTML = htmlResponse;

        } catch (error) {
            responseDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            showLoader(false);
        }
    });

    function showLoader(show, message = 'Processing...') {
        loader.querySelector('p').textContent = message;
        loader.classList.toggle('hidden', !show);
    }

    // --- Modal Logic ---
    responseDiv.addEventListener('click', async (e) => {
        // Check if it's a link
        if (e.target.tagName === 'A') {
            // If it's a chunk link (either with data attribute or href starting with chunk:)
            let chunkId = null;
            
            if (e.target.hasAttribute('data-chunk-id')) {
                chunkId = e.target.getAttribute('data-chunk-id');
            } else if (e.target.href && e.target.href.includes('chunk:')) {
                // Extract chunk ID from href if our replacement didn't work
                const match = e.target.href.match(/chunk:([^#\?]+)/);
                if (match) {
                    chunkId = match[1];
                }
            }
            
            if (chunkId) {
                e.preventDefault();
                e.stopPropagation();
                
                const sourceText = e.target.textContent;

                // Show loading state
                modalContent.innerHTML = '<h4>Loading source...</h4>';
                modal.classList.remove('hidden');

                // Handle fallback citation IDs (citation-1, citation-2, etc.)
                if (chunkId.startsWith('citation-')) {
                    modalContent.innerHTML = `
                        <h4>Citation Information</h4>
                        <p>This citation was generated as a fallback. The AI may have created citations that don't directly correspond to specific text chunks in the database.</p>
                        <p>Citation number: ${chunkId.replace('citation-', '')}</p>
                    `;
                    return;
                }

                try {
                    const res = await fetch(`/api/preview?chunkId=${chunkId}`);
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.message);
                    }
                    
                    modalContent.innerHTML = `
                        <h4>Source: ${data.source}, Page: ${data.page}</h4>
                        <p>${data.text}</p>
                    `;
                } catch (error) {
                    modalContent.innerHTML = `
                        <h4>Citation Error</h4>
                        <p>This citation could not be found in the database. This may happen when the AI references information that was synthesized from multiple sources or external knowledge.</p>
                        <p><strong>Error details:</strong> ${error.message}</p>
                    `;
                }
            }
        }
    });

    function closeModal() {
        modal.classList.add('hidden');
    }

    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});
