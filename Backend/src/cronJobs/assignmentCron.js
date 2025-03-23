const cron = require("node-cron");
const Assignment = require("../assignments/assignmentsModel");

const checkOverdueAssignments = () => {
  // Schedule cron job to run every minute
  cron.schedule("* * * * *", async () => {
    console.log("🔍 Checking for overdue assignments...");

    const now = new Date();

    try {
      const overdueAssignments = await Assignment.find({
        dueDate: { $lt: now },
        status: { $nin: ["completed", "unsubmitted" ,"reviewed"] },
      });

      if (overdueAssignments.length > 0) {
        let updatedCount = 0;

        for (const assignment of overdueAssignments) {
          let newStatus =
            assignment.submission && assignment.submission.submittedAt
              ? "completed"
              : "unsubmitted";

          await Assignment.updateOne(
            { _id: assignment._id },
            { $set: { status: newStatus } }
          );
          updatedCount++;
        }

        console.log(`✅ Updated ${updatedCount} overdue assignments.`);
      } else {
        console.log("⏳ No overdue assignments found.");
      }
    } catch (error) {
      console.error("❌ Error updating overdue assignments:", error);
    }
  });
};

module.exports = checkOverdueAssignments;
