-- Update N-th number question (Question ID 56)
UPDATE Question 
SET 
    test_inputs = '0\n1\n5\n10\n15',
    expected_outputs = '0\n1\n5\n55\n610'
WHERE question_id = 56;

-- Update factorial question (Question ID 57)
UPDATE Question 
SET 
    test_inputs = '0\n1\n3\n5\n7',
    expected_outputs = '1\n1\n6\n120\n5040'
WHERE question_id = 57;

-- Update palindrome question (Question ID 58)
UPDATE Question 
SET 
    test_inputs = 'madam\nhello\nracecar\nabcba',
    expected_outputs = 'True\nFalse\nTrue\nTrue'
WHERE question_id = 58;

-- Update prime number question (Question ID 59)
UPDATE Question 
SET 
    test_inputs = '1\n2\n4\n7\n9',
    expected_outputs = 'False\nTrue\nFalse\nTrue\nFalse'
WHERE question_id = 59;

-- Update number sequence question (Question ID 60)
UPDATE Question 
SET 
    test_inputs = '0\n1\n2\n3\n4\n5\n6',
    expected_outputs = '0\n6\n15\n24\n27'
WHERE question_id = 60;

-- Add templates for all Python questions
UPDATE Question
SET 
    template = CONCAT(
        "# Write a Python function to solve the problem\n",
        "# Don't forget to include print statements to show your output!\n\n",
        "def solution(n):\n",
        "    # Your code here\n",
        "    pass\n\n",
        "# Test with sample inputs\n",
        "print(solution(5))"
    )
WHERE language = 'Python' AND template IS NULL;

-- Add explicit instructions about printing output
UPDATE Question
SET 
    content = CONCAT(content, "\n\nIMPORTANT: Your solution must include print statements to display the output.")
WHERE language = 'Python' AND NOT content LIKE '%IMPORTANT:%';

-- General update for other Python questions to ensure proper template
UPDATE Question
SET 
    template = CONCAT(
        "# Write a Python function to solve the problem\n\n",
        "def ", LOWER(SUBSTRING_INDEX(content, ' ', -1)), "(n):\n",
        "    # Your solution here\n    pass\n\n",
        "# Test your function with example cases\n",
        "# print(", LOWER(SUBSTRING_INDEX(content, ' ', -1)), "(5))  # Add your test cases"
    )
WHERE language = 'Python' AND template IS NULL;

-- Add some helpful reminders in the question descriptions
UPDATE Question
SET 
    content = CONCAT(content, "\n\nRemember to print your function's output to see the results.")
WHERE language = 'Python' AND NOT content LIKE '%Remember to print%'; 