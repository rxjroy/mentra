const fetch = globalThis.fetch;

async function runTest() {
  console.log("1. Generating mock session...");
  const genRes = await fetch("http://localhost:3000/api/interview/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobDescription: "Senior Frontend Engineer with strong React and TypeScript experience.",
      role: "Frontend Engineer",
      company: "NovaTech",
      experienceLevel: "senior",
      mode: "full"
    })
  });

  const genData = await genRes.json();
  console.log("Created sessionId:", genData.sessionId);
  const sessionId = genData.sessionId;

  console.log("2. Answering Question 1...");
  const q1 = genData.session.questions[0];
  const scoreRes = await fetch("http://localhost:3000/api/interview/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q1.id,
      answerText: "In my previous project, we optimized React rendering using React.memo, useMemo for expensive filter calculations, and virtualized list items with react-window to maintain a smooth 60fps.",
      inputMode: "text"
    })
  });
  const scoreData = await scoreRes.json();
  console.log("Q1 scored:", scoreData.attempt?.scores);

  console.log("3. Fetching session to verify in_progress state...");
  const sessRes = await fetch(`http://localhost:3000/api/interview/session/${sessionId}`);
  const sessData = await sessRes.json();
  console.log("Session status:", sessData.session.status, "Answered questions count:", sessData.session.questions.filter(q => q.attempts.length > 0).length);

  console.log("4. Calling /api/interview/complete (End Interview button click)...");
  const compRes = await fetch("http://localhost:3000/api/interview/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  const compData = await compRes.json();
  console.log("Session marked status:", compData.session.status, "Readiness score:", compData.session.readinessScore);
}

runTest();
