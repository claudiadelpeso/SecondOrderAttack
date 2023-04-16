function findSQLQueriesAndCommandCount(input) {
    const regex = /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)[\s\S]*?\b\bFROM\b[\s\S]*?(\bWHERE\b[\s\S]*?|;|$)/gi;
    const commandRegex = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER|OUTER|LEFT|RIGHT|ON|GROUP BY|HAVING|ORDER BY|VALUES|SET|LIMIT|OFFSET|DISTINCT)\b/gi;
    let match;
    let result = {};
  
    while ((match = regex.exec(input)) !== null) {
      let query = match[0].trim();
      let commandCount = (query.match(commandRegex) || []).length;
      result[query] = commandCount;
    }
  
    return result;
  }
  
  // Example usage
  const input = `
    SELECT * FROM comments WHERE user_id = 1;
    INSERT INTO comments (user_id, content) VALUES (2, 'Hello, World!');
    UPDATE users SET name = 'John Doe' WHERE id = 1;
  `;
  
  console.log(findSQLQueriesAndCommandCount(input));
  