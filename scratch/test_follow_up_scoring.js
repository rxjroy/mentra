const fetch = globalThis.fetch;

async function testFollowUpEvaluation() {
  console.log("=== TESTING FOLLOW-UP DEEP-DIVE PROBE SCORING ===");

  console.log("1. Generating interview session...");
  const genRes = await fetch("http://localhost:3000/api/interview/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobDescription: "Junior Backend Developer with Python, FastAPI, and PostgreSQL at DataForge Technologies",
      role: "Junior Backend Developer",
      company: "DataForge Technologies",
      experienceLevel: "junior",
      mode: "full"
    })
  });

  const genData = await genRes.json();
  const sessionId = genData.sessionId;
  const q1 = genData.session.questions[0];
  console.log("Session ID:", sessionId);
  console.log("Question 1:", q1.text);

  console.log("\n2. Submitting Initial Answer (Attempt 1)...");
  const initialAnswer = "Thank you for having me. I'm Raj Roy, a recent graduate. My technical journey has focused on full-stack and Python backend development. One project where I used Python was SmartCampus with FastAPI and PostgreSQL, handling connection management and async API routes.";
  
  const score1Res = await fetch("http://localhost:3000/api/interview/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q1.id,
      answerText: initialAnswer,
      inputMode: "text"
    })
  });
  const score1Data = await score1Res.json();
  console.log("Attempt 1 Scores:", score1Data.attempt.scores);

  const followUpProbe = "That's a solid high-level overview of the request lifecycle. I want to dig a little deeper into the connection management you mentioned. You noted that you ensure sessions are returned to the pool even when an error occurs. How exactly did you implement that lifecycle management in FastAPI to guarantee that a session is always closed or released, even if an unhandled exception bubbles up from the endpoint logic?";

  console.log("\n3. Submitting Follow-up Response (Attempt 2 - FastAPI Dependency Injection)...");
  const followUpAnswer = "I handled that using FastAPI's dependency injection with a generator dependency and a finally block. For example, with SQLAlchemy, the dependency looks like: def get_db(): db = SessionLocal() try: yield db finally: db.close(). Then I inject it into the endpoint using Depends(get_db). The important part is the finally block: FastAPI manages the dependency lifecycle around the request, so when the endpoint finishes or an exception occurs, db.close() executes deterministically and releases the session to the connection pool.";

  const score2Res = await fetch("http://localhost:3000/api/interview/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q1.id,
      answerText: followUpAnswer,
      inputMode: "text",
      isFollowUp: true,
      followUpPrompt: followUpProbe,
      previousAnswer: initialAnswer
    })
  });
  const score2Data = await score2Res.json();

  console.log("\n=== ATTEMPT 2 SCORING RESULTS ===");
  console.log("Scores:", score2Data.attempt.scores);
  console.log("Improvement Delta:", score2Data.attempt.improvementScore);
  console.log("Feedback:", score2Data.attempt.feedback);
  console.log("Extracted Topics:", score2Data.attempt.extractedTopics);

  console.log("\n4. Calling Chat API on Follow-up Response...");
  const chatRes = await fetch("http://localhost:3000/api/interview/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q1.id,
      userAnswer: followUpAnswer,
      attemptCount: 2,
      score: 8.8,
      isFollowUp: true,
      followUpPrompt: followUpProbe
    })
  });
  const chatData = await chatRes.json();
  console.log("Interviewer Response:", chatData.message);
  console.log("hasFollowUp (Expected false):", chatData.hasFollowUp);
}

testFollowUpEvaluation();
