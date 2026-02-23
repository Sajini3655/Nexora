package com.admin.service;

import com.admin.repository.TaskSubtaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskProgressService {

    private final TaskSubtaskRepository subtaskRepository;

    public Progress compute(Long taskId) {
        int total = subtaskRepository.sumPoints(taskId);
        int done = subtaskRepository.sumDonePoints(taskId);
        int pct = total <= 0 ? 0 : (int) Math.round((done * 100.0) / total);
        int count = (int) subtaskRepository.countByTaskId(taskId);
        return new Progress(pct, done, total, count);
    }

    public record Progress(int percent, int donePoints, int totalPoints, int subtaskCount) {}
}
