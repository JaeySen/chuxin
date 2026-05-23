document.addEventListener('DOMContentLoaded', () => {
    const vocabulary = [
        { vietnamese: "uống nước", chinese: "喝水" },
        { vietnamese: "ăn cơm", chinese: "吃饭" },
        { vietnamese: "trà sữa", chinese: "奶茶" },
        { vietnamese: "bia", chinese: "啤酒" },
        { vietnamese: "rượu", chinese: "酒" },
        { vietnamese: "ngân hàng", chinese: "银行" }
    ];

    const gridContainer = document.getElementById('grid-container');
    const promptWordElement = document.getElementById('prompt-word');
    const messageElement = document.getElementById('message');
    const gridSize = 5;
    const totalCells = gridSize * gridSize; // 25

    let remainingWords = [...vocabulary]; // Tạo bản sao để theo dõi từ còn lại
    let currentWordPair = null;
    let correctWordsFound = 0;

    // Hàm xáo trộn mảng (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // Hàm chọn từ tiếp theo
    function selectNextWord() {
        if (remainingWords.length === 0) {
            messageElement.textContent = "Chúc mừng! Bạn đã hoàn thành tất cả các từ!";
            promptWordElement.textContent = "🎉";
            // Vô hiệu hóa các ô còn lại nếu muốn
            const cells = gridContainer.querySelectorAll('.grid-cell:not(.correct)');
            cells.forEach(cell => cell.style.pointerEvents = 'none');
            return false; // Không còn từ nào
        }

        // Chọn ngẫu nhiên một từ từ danh sách còn lại
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        currentWordPair = remainingWords[randomIndex];

        // Loại bỏ từ đã chọn khỏi danh sách còn lại
        remainingWords.splice(randomIndex, 1);

        // Hiển thị từ tiếng Việt cần tìm
        promptWordElement.textContent = currentWordPair.vietnamese;
        messageElement.textContent = ''; // Xóa thông báo cũ
        return true; // Còn từ để chơi
    }

    // Hàm điền từ vào lưới
    function populateGrid() {
        // Lấy tất cả các từ tiếng Trung từ danh sách gốc
        const allChineseWords = vocabulary.map(pair => pair.chinese);
        const correctChineseWord = currentWordPair.chinese;

        // Tạo danh sách các từ ngẫu nhiên để điền vào lưới
        let gridWords = [correctChineseWord]; // Bắt đầu với từ đúng

        // Lấy các từ sai (distractors)
        let distractors = allChineseWords.filter(word => word !== correctChineseWord);
        shuffleArray(distractors);

        // Điền các ô còn lại bằng từ sai, cho phép lặp lại nếu cần
        for (let i = 1; i < totalCells; i++) {
            // Nếu hết từ sai duy nhất, bắt đầu dùng lại từ đầu danh sách sai
            gridWords.push(distractors[(i - 1) % distractors.length]);
        }

        // Xáo trộn toàn bộ danh sách từ sẽ hiển thị trên lưới
        shuffleArray(gridWords);

        // Cập nhật nội dung và trạng thái các ô
        const cells = gridContainer.querySelectorAll('.grid-cell');
        cells.forEach((cell, index) => {
            // Chỉ cập nhật những ô chưa được đoán đúng
            if (!cell.classList.contains('correct')) {
                cell.textContent = gridWords[index];
                cell.classList.remove('incorrect'); // Xóa class sai nếu có từ vòng trước
                 cell.style.pointerEvents = 'auto'; // Cho phép click lại
            }
        });
    }

    // Hàm xử lý khi người chơi nhấp vào ô
    function handleCellClick(event) {
        const clickedCell = event.target;

        // Bỏ qua nếu ô đã đúng hoặc không phải là ô hợp lệ
        if (!clickedCell.classList.contains('grid-cell') || clickedCell.classList.contains('correct')) {
            return;
        }

        const clickedWord = clickedCell.textContent;

        if (clickedWord === currentWordPair.chinese) {
            // Đúng
            clickedCell.classList.add('correct');
            clickedCell.style.pointerEvents = 'none'; // Vô hiệu hóa ô đúng
            correctWordsFound++;

            // Chờ một chút rồi chuyển sang từ tiếp theo
            setTimeout(() => {
                if (selectNextWord()) {
                    populateGrid();
                }
            }, 500); // 0.5 giây

        } else {
            // Sai
            clickedCell.classList.add('incorrect');
            // Xóa hiệu ứng nhấp nháy sau một thời gian ngắn
            setTimeout(() => {
                clickedCell.classList.remove('incorrect');
            }, 500); // 0.5 giây
        }
    }

    // Hàm khởi tạo trò chơi
    function initGame() {
        gridContainer.innerHTML = ''; // Xóa lưới cũ nếu có
        correctWordsFound = 0;
        remainingWords = [...vocabulary]; // Reset danh sách từ

        // Tạo các ô trong lưới
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.addEventListener('click', handleCellClick);
            gridContainer.appendChild(cell);
        }

        // Bắt đầu vòng chơi đầu tiên
        if (selectNextWord()) {
            populateGrid();
        }
    }

    // Bắt đầu trò chơi khi trang tải xong
    initGame();

});