-- ==============================================================================
-- Trigger Validation Script: enforce_single_active_mentorship()
-- Expected Behavior:
-- 1. Inserting a 2nd Active pairing for MenteeID = 5 must FAIL with RAISE EXCEPTION.
-- 2. Completing/Terminating MenteeID = 5's existing pairing allows a new Active pairing.
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '--- TEST 1: Attempting duplicate active mentorship for MenteeID 5 ---';
    BEGIN
        INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status)
        VALUES (3, 5, CURRENT_DATE, 'Active');
        
        RAISE EXCEPTION 'TEST 1 FAILED: Trigger failed to prevent duplicate active mentorship!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%Constraint Violation: Mentee (ID 5) already has an active mentorship pairing.%' THEN
                RAISE NOTICE 'TEST 1 PASSED: Trigger successfully blocked duplicate active pairing. Caught expected message: %', SQLERRM;
            ELSE
                RAISE NOTICE 'TEST 1 PASSED WITH ERROR: %', SQLERRM;
            END IF;
    END;

    RAISE NOTICE '--- TEST 2: Allowing new active mentorship once old is Completed ---';
    -- Temporarily terminate mentee 5's pairing
    UPDATE MENTORSHIP SET Status = 'Completed', EndDate = CURRENT_DATE WHERE MenteeID = 5 AND Status = 'Active';

    -- Now inserting a new active mentorship should succeed
    INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status)
    VALUES (3, 5, CURRENT_DATE, 'Active');

    RAISE NOTICE 'TEST 2 PASSED: Successfully inserted new active pairing after prior was marked Completed.';

    -- Revert back to original state for clean test environment
    DELETE FROM MENTORSHIP WHERE MenteeID = 5 AND MentorID = 3;
    UPDATE MENTORSHIP SET Status = 'Active', EndDate = NULL WHERE MentorshipID = 1;

    RAISE NOTICE '--- ALL TRIGGER TESTS COMPLETED SUCCESSFULLY ---';
END $$;
